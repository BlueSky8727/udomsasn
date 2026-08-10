import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MediaStatus,
  Prisma,
  ReviewDecision,
  ReviewResultValue,
  ReviewStage,
  UserRole,
} from '@prisma/client';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import type { JwtUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { extractTextFromFile } from './text-extractor';

const REVIEW_TOPIC_IDS = [
  'learning_objectives',
  'learning_content',
  'learning_process',
  'assessment',
  'supporting_media',
] as const;

/** ข้อความแจ้งเตือนถึงผู้ใช้เป็นภาษาไทย ต้องตรงกับ STATUS_LABELS ฝั่ง Next.js (กฎเหล็กข้อ 9) */
const STATUS_LABELS: Record<MediaStatus, string> = {
  DRAFT: 'ร่าง',
  PENDING: 'รอตรวจโดยกลุ่มสาระ',
  IN_REVIEW: 'กลุ่มสาระกำลังตรวจ',
  ACADEMIC_REVIEW: 'รอตรวจโดยหัวหน้าวิชาการ',
  REVISION: 'ให้แก้ไข',
  ACADEMIC_REVISION: 'แก้ไขเล็กน้อย',
  APPROVED: 'เผยแพร่แล้ว',
  REJECTED: 'ไม่ผ่าน',
  ARCHIVED: 'ถอดออกจากคลัง',
};

const mediaInclude = {
  owner: { select: { id: true, name: true, email: true, department: true } },
  assignee: { select: { id: true, name: true } },
  files: {
    select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
    orderBy: { createdAt: 'desc' as const },
  },
  reviews: {
    include: {
      reviewer: { select: { name: true, role: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  statusLogs: {
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  aiReviews: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.MediaInclude;

const publicMediaInclude = {
  owner: { select: { name: true } },
  files: { select: { id: true, name: true, mimeType: true, size: true, createdAt: true } },
} satisfies Prisma.MediaInclude;

type MediaRecord = Prisma.MediaGetPayload<{ include: typeof mediaInclude }>;
type Transaction = Prisma.TransactionClient;

export type MediaInput = {
  title?: string;
  description?: string;
  subject?: string;
  subjectGroup?: string;
  gradeLevel?: string;
  mediaType?: string;
  learningObjectives?: Prisma.InputJsonValue;
  assessments?: Prisma.InputJsonValue;
  learningProcess?: string;
  license?: string;
  tags?: string[];
  attachmentNote?: string;
  submit?: boolean;
};

export type ReviewPayload = {
  results?: Record<string, ReviewResultValue | null>;
  comments?: Record<string, string>;
  summary?: string;
  to?: MediaStatus;
  reason?: string;
};

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  private code(): string {
    const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
    return `MED-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }

  private validateInput(input: MediaInput, requireComplete: boolean): void {
    if (!requireComplete) return;
    const required = [input.title, input.description, input.subject, input.gradeLevel];
    if (required.some((value) => !value?.trim())) {
      throw new BadRequestException('กรอกชื่อ เนื้อหา วิชา และระดับชั้นให้ครบ');
    }
    if (!input.learningObjectives || Object.keys(input.learningObjectives).length === 0) {
      throw new BadRequestException('กรอกจุดประสงค์การเรียนรู้ให้ครบ');
    }
  }

  private assertCanRead(media: MediaRecord, user: JwtUser): void {
    if (media.status === MediaStatus.APPROVED || user.role === UserRole.ACADEMIC_HEAD) return;
    if (user.role === UserRole.TEACHER && media.ownerId === user.sub) return;
    throw new NotFoundException();
  }

  async create(user: JwtUser, input: MediaInput, files: Express.Multer.File[]) {
    if (user.role !== UserRole.TEACHER) throw new ForbiddenException();
    this.validateInput(input, Boolean(input.submit));
    if (input.submit && files.length === 0) throw new BadRequestException('ต้องแนบไฟล์อย่างน้อย 1 ไฟล์');

    return this.prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          code: this.code(),
          title: input.title?.trim() || 'ฉบับร่างไม่มีชื่อ',
          description: input.description?.trim() ?? '',
          subject: input.subject?.trim() ?? '',
          subjectGroup: input.subjectGroup?.trim() || input.subject?.trim() || '',
          gradeLevel: input.gradeLevel?.trim() ?? '',
          mediaType: input.mediaType?.trim() || 'เอกสาร',
          learningObjectives: input.learningObjectives ?? {},
          assessments: input.assessments ?? {},
          learningProcess: input.learningProcess?.trim(),
          license: input.license?.trim(),
          tags: input.tags ?? [],
          attachmentNote: input.attachmentNote?.trim(),
          ownerId: user.sub,
          files: {
            create: files.map((file) => ({
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
            })),
          },
        },
      });
      if (input.submit) {
        await tx.statusLog.create({
          data: {
            mediaId: media.id,
            actorId: user.sub,
            fromStatus: MediaStatus.DRAFT,
            toStatus: MediaStatus.PENDING,
          },
        });
        await tx.media.update({
          where: { id: media.id },
          data: { status: MediaStatus.PENDING, reviewStage: ReviewStage.SUBJECT_GROUP },
        });
      }
      return tx.media.findUniqueOrThrow({ where: { id: media.id }, include: mediaInclude });
    });
  }

  async update(user: JwtUser, id: string, input: MediaInput, files: Express.Multer.File[]) {
    if (user.role !== UserRole.TEACHER) throw new ForbiddenException();
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.media.findUnique({
        where: { id },
        include: { files: true, reviews: { include: { items: true } } },
      });
      if (!current) throw new NotFoundException();
      if (current.ownerId !== user.sub) throw new ForbiddenException();
      if (!(<MediaStatus[]>[MediaStatus.DRAFT, MediaStatus.REVISION, MediaStatus.ACADEMIC_REVISION]).includes(current.status)) {
        throw new BadRequestException('สถานะนี้แก้ไขไม่ได้');
      }
      const merged: MediaInput = {
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        subject: input.subject ?? current.subject,
        subjectGroup: input.subjectGroup ?? current.subjectGroup,
        gradeLevel: input.gradeLevel ?? current.gradeLevel,
        mediaType: input.mediaType ?? current.mediaType,
        learningObjectives: input.learningObjectives ?? (current.learningObjectives as Prisma.InputJsonValue),
        assessments: input.assessments ?? (current.assessments as Prisma.InputJsonValue),
        learningProcess: input.learningProcess ?? current.learningProcess ?? undefined,
        license: input.license ?? current.license ?? undefined,
        tags: input.tags ?? current.tags,
        attachmentNote: input.attachmentNote ?? current.attachmentNote ?? undefined,
        submit: input.submit,
      };
      this.validateInput(merged, Boolean(input.submit));
      if (input.submit && current.files.length + files.length === 0) {
        throw new BadRequestException('ต้องแนบไฟล์อย่างน้อย 1 ไฟล์');
      }

      if (current.status !== MediaStatus.DRAFT) {
        const snapshot = JSON.parse(JSON.stringify(current)) as Prisma.InputJsonValue;
        await tx.mediaVersion.upsert({
          where: { mediaId_version: { mediaId: id, version: current.version } },
          create: { mediaId: id, version: current.version, snapshot },
          update: {},
        });
      }

      const target =
        current.status === MediaStatus.ACADEMIC_REVISION
          ? MediaStatus.ACADEMIC_REVIEW
          : MediaStatus.PENDING;
      const nextVersion = input.submit && current.status !== MediaStatus.DRAFT
        ? current.version + 1
        : current.version;
      await tx.media.update({
        where: { id },
        data: {
          title: merged.title?.trim(),
          description: merged.description?.trim(),
          subject: merged.subject?.trim(),
          subjectGroup: merged.subjectGroup?.trim(),
          gradeLevel: merged.gradeLevel?.trim(),
          mediaType: merged.mediaType?.trim(),
          learningObjectives: merged.learningObjectives,
          assessments: merged.assessments,
          learningProcess: merged.learningProcess?.trim(),
          license: merged.license?.trim(),
          tags: merged.tags,
          attachmentNote: merged.attachmentNote?.trim(),
          version: nextVersion,
          ...(input.submit ? { status: target, reviewStage: target === MediaStatus.PENDING ? ReviewStage.SUBJECT_GROUP : ReviewStage.ACADEMIC, assigneeId: null } : {}),
          files: {
            create: files.map((file) => ({
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
            })),
          },
        },
      });
      if (input.submit) {
        await tx.statusLog.create({
          data: { mediaId: id, actorId: user.sub, fromStatus: current.status, toStatus: target },
        });
      }
      return tx.media.findUniqueOrThrow({ where: { id }, include: mediaInclude });
    });
  }

  mine(ownerId: string) {
    return this.prisma.media.findMany({ where: { ownerId }, include: mediaInclude, orderBy: { updatedAt: 'desc' } });
  }

  publicList() {
    return this.prisma.media.findMany({ where: { status: MediaStatus.APPROVED }, include: publicMediaInclude, orderBy: { updatedAt: 'desc' } });
  }

  async one(id: string, user: JwtUser) {
    const media = await this.prisma.media.findUnique({ where: { id }, include: mediaInclude });
    if (!media) throw new NotFoundException();
    if (media.status === MediaStatus.APPROVED && user.role === UserRole.TEACHER && media.ownerId !== user.sub) {
      return this.prisma.media.findUniqueOrThrow({ where: { id }, include: publicMediaInclude });
    }
    if (user.role === UserRole.REVIEWER && media.status !== MediaStatus.APPROVED) {
      const account = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { department: true } });
      if (!account?.department || account.department !== media.subjectGroup) throw new NotFoundException();
    } else {
      this.assertCanRead(media, user);
    }
    return media;
  }

  async queue(user: JwtUser) {
    // ผู้ดูแลระบบและอาจารย์ไม่มีสิทธิ์ในคิวตรวจ ต้องปฏิเสธให้ชัด ไม่ใช่ตอบลิสต์ว่าง
    const reviewers: UserRole[] = [UserRole.REVIEWER, UserRole.ACADEMIC_HEAD];
    if (!reviewers.includes(user.role)) throw new ForbiddenException();
    if (user.role === UserRole.ACADEMIC_HEAD) {
      return this.prisma.media.findMany({
        where: { status: { in: [MediaStatus.ACADEMIC_REVIEW] } },
        include: mediaInclude,
        orderBy: { updatedAt: 'asc' },
      });
    }
    const account = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { department: true } });
    if (!account?.department) return [];
    return this.prisma.media.findMany({
      where: {
        subjectGroup: account.department,
        status: { in: [MediaStatus.PENDING, MediaStatus.IN_REVIEW] },
        OR: [{ assigneeId: null }, { assigneeId: user.sub }],
      },
      include: mediaInclude,
      orderBy: { updatedAt: 'asc' },
    });
  }

  async transition(id: string, user: JwtUser, to: MediaStatus, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const media = await tx.media.findUnique({ where: { id }, include: { files: true } });
      if (!media) throw new NotFoundException();
      if (media.status === MediaStatus.PENDING && to === MediaStatus.IN_REVIEW) {
        if (user.role !== UserRole.REVIEWER || media.assigneeId) throw new ForbiddenException();
        const reviewer = await tx.user.findUnique({ where: { id: user.sub }, select: { department: true } });
        if (!reviewer?.department || reviewer.department !== media.subjectGroup) throw new ForbiddenException();
        return this.applyTransition(tx, media, user, to, reason, user.sub);
      }
      if (media.status === MediaStatus.IN_REVIEW && to === MediaStatus.PENDING) {
        if (user.role !== UserRole.REVIEWER || media.assigneeId !== user.sub) throw new ForbiddenException();
        return this.applyTransition(tx, media, user, to, reason, null);
      }
      if (media.status === MediaStatus.APPROVED && to === MediaStatus.ARCHIVED) {
        if (user.role !== UserRole.ACADEMIC_HEAD || !reason?.trim()) throw new ForbiddenException();
        return this.applyTransition(tx, media, user, to, reason, null);
      }
      throw new BadRequestException('การเปลี่ยนสถานะนี้ต้องทำผ่านขั้นตอนที่กำหนด');
    });
  }

  private async applyTransition(
    tx: Transaction,
    media: { id: string; ownerId: string; status: MediaStatus; assigneeId: string | null },
    user: JwtUser,
    to: MediaStatus,
    reason?: string,
    assigneeId: string | null = media.assigneeId,
  ) {
    await tx.statusLog.create({
      data: { mediaId: media.id, actorId: user.sub, fromStatus: media.status, toStatus: to, reason },
    });
    const reviewStage = (<MediaStatus[]>[MediaStatus.ACADEMIC_REVIEW, MediaStatus.APPROVED]).includes(to)
      ? ReviewStage.ACADEMIC
      : (<MediaStatus[]>[MediaStatus.PENDING, MediaStatus.IN_REVIEW, MediaStatus.REVISION]).includes(to)
        ? ReviewStage.SUBJECT_GROUP
        : undefined;
    await tx.media.update({ where: { id: media.id }, data: { status: to, assigneeId, reviewStage } });
    if ((<MediaStatus[]>[MediaStatus.REVISION, MediaStatus.REJECTED, MediaStatus.APPROVED, MediaStatus.ACADEMIC_REVISION]).includes(to)) {
      await tx.notification.create({
        data: {
          userId: media.ownerId,
          title: 'สถานะสื่อมีการเปลี่ยนแปลง',
          message: `สถานะใหม่: ${STATUS_LABELS[to]}${reason ? ` · ${reason}` : ''}`,
          href: `/my-media/${media.id}`,
        },
      });
    }
    return tx.media.findUniqueOrThrow({ where: { id: media.id }, include: mediaInclude });
  }

  async saveReview(mediaId: string, user: JwtUser, payload: ReviewPayload, complete: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const media = await tx.media.findUnique({ where: { id: mediaId } });
      if (!media) throw new NotFoundException();
      const isAcademic = user.role === UserRole.ACADEMIC_HEAD;
      const stage = isAcademic ? ReviewStage.ACADEMIC : ReviewStage.SUBJECT_GROUP;
      if (isAcademic) {
        if (media.status !== MediaStatus.ACADEMIC_REVIEW) throw new ForbiddenException();
      } else {
        if (user.role !== UserRole.REVIEWER || media.status !== MediaStatus.IN_REVIEW || media.assigneeId !== user.sub) {
          throw new ForbiddenException();
        }
      }

      let review = await tx.review.findFirst({ where: { mediaId, reviewerId: user.sub, stage } });
      review = review
        ? await tx.review.update({ where: { id: review.id }, data: { summary: payload.summary?.trim() } })
        : await tx.review.create({ data: { mediaId, reviewerId: user.sub, stage, summary: payload.summary?.trim() } });

      for (const topicId of REVIEW_TOPIC_IDS) {
        const result = payload.results?.[topicId];
        const comment = payload.comments?.[topicId]?.trim();
        if (result === undefined && comment === undefined) continue;
        await tx.reviewItem.upsert({
          where: { reviewId_topicId: { reviewId: review.id, topicId } },
          update: { result: result ?? null, comment: comment || null },
          create: { reviewId: review.id, topicId, result: result ?? null, comment: comment || null },
        });
      }
      if (!complete) return tx.review.findUniqueOrThrow({ where: { id: review.id }, include: { items: true } });

      const items = await tx.reviewItem.findMany({ where: { reviewId: review.id } });
      const to = payload.to;
      if (!to) throw new BadRequestException('ไม่ได้ระบุผลการตัดสิน');
      const allowedTargets: MediaStatus[] = isAcademic
        ? [MediaStatus.APPROVED, MediaStatus.ACADEMIC_REVISION]
        : [MediaStatus.ACADEMIC_REVIEW, MediaStatus.REVISION, MediaStatus.REJECTED];
      if (!allowedTargets.includes(to)) throw new ForbiddenException();
      const completeResults = REVIEW_TOPIC_IDS.every((topicId) => items.some((item) => item.topicId === topicId && item.result));
      const commentCount = items.filter((item) => item.comment?.trim()).length;
      if ((<MediaStatus[]>[MediaStatus.ACADEMIC_REVIEW, MediaStatus.APPROVED]).includes(to) && !completeResults) {
        throw new BadRequestException('ต้องตรวจให้ครบทุกหัวข้อ');
      }
      if ((<MediaStatus[]>[MediaStatus.REVISION, MediaStatus.ACADEMIC_REVISION]).includes(to) && commentCount === 0) {
        throw new BadRequestException('ต้องมีคอมเมนต์อย่างน้อย 1 หัวข้อ');
      }
      const reason = payload.reason?.trim() || payload.summary?.trim();
      if (to === MediaStatus.REJECTED && !reason) throw new BadRequestException('ต้องระบุเหตุผล');

      let decision: ReviewDecision;
      switch (to) {
        case MediaStatus.ACADEMIC_REVIEW: decision = ReviewDecision.FORWARD; break;
        case MediaStatus.REVISION: decision = ReviewDecision.REVISION; break;
        case MediaStatus.REJECTED: decision = ReviewDecision.REJECTED; break;
        case MediaStatus.APPROVED: decision = ReviewDecision.APPROVED; break;
        case MediaStatus.ACADEMIC_REVISION: decision = ReviewDecision.MINOR_REVISION; break;
        default: throw new ForbiddenException();
      }
      await tx.review.update({
        where: { id: review.id },
        data: { decision, completedAt: new Date(), summary: payload.summary?.trim() },
      });
      return this.applyTransition(tx, media, user, to, reason, to === MediaStatus.ACADEMIC_REVIEW ? null : media.assigneeId);
    });
  }

  async remove(id: string, user: JwtUser) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException();
    if (media.ownerId !== user.sub || user.role !== UserRole.TEACHER || media.status !== MediaStatus.DRAFT) {
      throw new ForbiddenException();
    }
    await this.prisma.media.delete({ where: { id } });
    return { ok: true };
  }

  async fileForDownload(mediaId: string, fileId: string, user: JwtUser) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId }, include: mediaInclude });
    if (!media) throw new NotFoundException();
    if (user.role === UserRole.REVIEWER && media.status !== MediaStatus.APPROVED) {
      const reviewer = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { department: true } });
      if (reviewer?.department !== media.subjectGroup) throw new NotFoundException();
    } else {
      this.assertCanRead(media, user);
    }
    const file = await this.prisma.mediaFile.findFirst({ where: { id: fileId, mediaId } });
    if (!file) throw new NotFoundException();
    const uploadRoot = resolve(process.env.UPLOAD_DIR ?? 'uploads');
    const absolutePath = resolve(file.path);
    const relativePath = relative(uploadRoot, absolutePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) throw new ForbiddenException();
    if (!existsSync(absolutePath)) throw new NotFoundException('ไม่พบไฟล์ในระบบจัดเก็บ');
    await this.prisma.$transaction([
      this.prisma.download.create({ data: { mediaId, userId: user.sub } }),
      this.prisma.media.update({ where: { id: mediaId }, data: { downloadCount: { increment: 1 } } }),
    ]);
    return { ...file, absolutePath };
  }

  async saveAiReview(mediaId: string, user: JwtUser, provider: string, result: Prisma.InputJsonValue) {
    if (user.role !== UserRole.REVIEWER && user.role !== UserRole.ACADEMIC_HEAD) throw new ForbiddenException();
    await this.one(mediaId, user);
    return this.prisma.aiReview.create({ data: { mediaId, actorId: user.sub, provider, result } });
  }

  async extractedText(mediaId: string, user: JwtUser) {
    await this.one(mediaId, user);
    if (user.role !== UserRole.REVIEWER && user.role !== UserRole.ACADEMIC_HEAD) throw new ForbiddenException();
    const files = await this.prisma.mediaFile.findMany({ where: { mediaId }, orderBy: { createdAt: 'asc' } });
    const parts: string[] = [];
    for (const file of files) {
      const text = await extractTextFromFile(resolve(file.path), file.name);
      if (text) parts.push(`ไฟล์: ${file.name}\n${text}`);
      if (parts.join('\n\n').length >= 60_000) break;
    }
    return { text: parts.join('\n\n').slice(0, 60_000), filesProcessed: files.length };
  }
}
