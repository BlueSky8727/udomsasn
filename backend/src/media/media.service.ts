import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
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
import { STATUS_LABELS } from '@udomsasn/workflow';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import type { JwtUser } from '../auth/auth.types';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { extractTextFromFile } from './text-extractor';
import { removeStoredFiles } from './upload-security';
import { assertMediaTransition } from './workflow';

const REVIEW_TOPIC_IDS = [
  'learning_objectives',
  'learning_content',
  'learning_process',
  'assessment',
  'supporting_media',
] as const;

const mediaInclude = {
  owner: { select: { id: true, name: true, email: true, department: true } },
  assignee: { select: { id: true, name: true } },
  files: {
    select: { id: true, name: true, mimeType: true, size: true, version: true, createdAt: true },
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
  files: { select: { id: true, name: true, mimeType: true, size: true, version: true, createdAt: true } },
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

export type PublicMediaQuery = {
  q?: string;
  subject?: string;
  grade?: string;
  page: number;
  pageSize: number;
};

/**
 * อีเมลที่รอส่งหลัง transaction commit
 *
 * เก็บเป็นรายการก่อนแล้วส่งทีหลัง เพราะการส่งเมลเป็น side effect ที่ย้อนกลับไม่ได้
 * ถ้ายิงเมลอยู่ใน transaction แล้ว transaction rollback ผู้รับจะได้อีเมลแจ้งเรื่องที่ไม่เกิดขึ้น
 */
type PendingMail = {
  to: string;
  name: string;
  subject: string;
  lines: string[];
};

/** ข้อมูลของสื่อเท่าที่ต้องใช้ประกอบข้อความแจ้งเตือน */
type NotifiableMedia = {
  id: string;
  code: string;
  title: string;
  ownerId: string;
  subjectGroup: string;
};

/** สถานะที่เจ้าของสื่อต้องรู้ผลทันที เพราะมีงานให้ทำต่อหรือจบกระบวนการแล้ว */
const OWNER_ALERT_STATUSES: readonly MediaStatus[] = [
  MediaStatus.REVISION,
  MediaStatus.ACADEMIC_REVISION,
  MediaStatus.APPROVED,
  MediaStatus.REJECTED,
];

const appUrl = () => (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const csvValues = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20) ?? [];

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * เขียนแจ้งเตือนในระบบให้ทุกคนที่ต้องรู้ และคืนรายการอีเมลที่ต้องส่งหลัง commit
   *
   * เจ้าของได้รับเมื่อมีผลตรวจกลับมา ผู้ตรวจได้รับเมื่อมีงานเข้าคิวของตัวเอง
   * ถ้าไม่แจ้งขาเข้าคิว ผู้ตรวจต้องเปิดหน้าคิวเช็คเองซึ่งทำให้งานค้างเกิน SLA ได้ง่าย
   */
  private async notifyTransition(
    tx: Transaction,
    media: NotifiableMedia,
    to: MediaStatus,
    reason: string | undefined,
    mails: PendingMail[],
  ): Promise<void> {
    const statusLabel = STATUS_LABELS[to];
    const base = appUrl();

    if (OWNER_ALERT_STATUSES.includes(to)) {
      const owner = await tx.user.findUnique({
        where: { id: media.ownerId },
        select: { email: true, name: true },
      });
      const href = `/my-media/${media.id}`;
      await tx.notification.create({
        data: {
          userId: media.ownerId,
          title: 'สถานะสื่อมีการเปลี่ยนแปลง',
          message: `สถานะใหม่: ${statusLabel}${reason ? ` · ${reason}` : ''}`,
          href,
        },
      });
      if (owner) {
        mails.push({
          to: owner.email,
          name: owner.name,
          subject: `ผลตรวจสื่อ ${media.title} — ${statusLabel}`,
          lines: [
            `สื่อ "${media.title}" (${media.code}) มีผลตรวจแล้ว`,
            `สถานะใหม่: ${statusLabel}`,
            ...(reason ? ['', `หมายเหตุจากผู้ตรวจ: ${reason}`] : []),
            '',
            `เปิดดูผลตรวจรายหัวข้อได้ที่ ${base}${href}`,
          ],
        });
      }
      return;
    }

    // ขาเข้าคิว: หากลุ่มผู้ตรวจที่รับงานนี้ได้จริงตามตำแหน่งและกลุ่มสาระ
    const recipients =
      to === MediaStatus.PENDING
        ? await tx.user.findMany({
            where: {
              role: UserRole.REVIEWER,
              accountStatus: 'ACTIVE',
              department: media.subjectGroup,
            },
            select: { id: true, email: true, name: true },
          })
        : to === MediaStatus.ACADEMIC_REVIEW
          ? await tx.user.findMany({
              where: { role: UserRole.ACADEMIC_HEAD, accountStatus: 'ACTIVE' },
              select: { id: true, email: true, name: true },
            })
          : [];
    if (recipients.length === 0) return;

    const href = `/review/${media.id}`;
    await tx.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        title: 'มีสื่อรอตรวจในคิวของคุณ',
        message: `${media.title} (${media.code}) · ${statusLabel}`,
        href,
      })),
    });
    for (const recipient of recipients) {
      mails.push({
        to: recipient.email,
        name: recipient.name,
        subject: `มีสื่อรอตรวจ: ${media.title}`,
        lines: [
          `สื่อ "${media.title}" (${media.code}) เข้าคิวตรวจของคุณแล้ว`,
          `สถานะ: ${statusLabel}`,
          '',
          `เปิดงานเพื่อรับเรื่องได้ที่ ${base}${href}`,
        ],
      });
    }
  }

  /**
   * ส่งอีเมลที่ค้างอยู่แบบไม่รอผล
   *
   * เรียกหลัง transaction commit เท่านั้น สถานะถูกบันทึกไปแล้ว
   * ผู้ใช้จึงไม่ควรต้องรอเซิร์ฟเวอร์เมลตอบก่อนเห็นผลการกดปุ่ม
   */
  private dispatchMails(mails: readonly PendingMail[]): void {
    if (mails.length === 0) return;
    void Promise.all(
      mails.map((mail) => this.mail.sendMediaNotification(mail.to, mail.name, mail.subject, mail.lines)),
    ).catch((error: Error) => {
      this.logger.error(`ส่งอีเมลแจ้งเตือนไม่สำเร็จ: ${error.message}`);
    });
  }

  private code(): string {
    const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
    return `MED-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }

  private validateInput(input: MediaInput, requireComplete: boolean): void {
    if (!requireComplete) return;
    if (!this.hasCompleteMetadata(input)) {
      throw new BadRequestException('กรอกชื่อ เนื้อหา วิชา และระดับชั้นให้ครบ');
    }
  }

  private hasCompleteMetadata(input: MediaInput): boolean {
    const required = [input.title, input.description, input.subject, input.gradeLevel];
    return !required.some((value) => !value?.trim()) &&
      Boolean(
        input.learningObjectives &&
        typeof input.learningObjectives === 'object' &&
        !Array.isArray(input.learningObjectives) &&
        Object.keys(input.learningObjectives).length > 0,
      );
  }

  private async assertCanRead(media: MediaRecord, user: JwtUser): Promise<void> {
    if (media.status === MediaStatus.APPROVED || user.role === UserRole.ACADEMIC_HEAD) return;
    if (user.role === UserRole.TEACHER && media.ownerId === user.sub) return;

    if (user.role === UserRole.REVIEWER) {
      const reviewer = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { department: true },
      });
      const canReadQueueItem =
        media.status === MediaStatus.PENDING && media.assigneeId === null;
      const canReadAssignedItem =
        media.status === MediaStatus.IN_REVIEW && media.assigneeId === user.sub;
      if (
        reviewer?.department &&
        reviewer.department === media.subjectGroup &&
        (canReadQueueItem || canReadAssignedItem)
      ) {
        return;
      }
    }

    throw new NotFoundException();
  }

  async create(user: JwtUser, input: MediaInput, files: Express.Multer.File[]) {
    if (user.role !== UserRole.TEACHER) throw new ForbiddenException();
    this.validateInput(input, Boolean(input.submit));
    if (input.submit && files.length === 0) throw new BadRequestException('ต้องแนบไฟล์อย่างน้อย 1 ไฟล์');
    if (input.submit) {
      assertMediaTransition(MediaStatus.DRAFT, MediaStatus.PENDING, {
        actorRole: user.role,
        actorId: user.sub,
        ownerId: user.sub,
        hasCompleteMetadata: this.hasCompleteMetadata(input),
        fileCount: files.length,
      });
    }

    const mails: PendingMail[] = [];
    const created = await this.prisma.$transaction(async (tx) => {
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
        await this.notifyTransition(tx, media, MediaStatus.PENDING, undefined, mails);
      }
      return tx.media.findUniqueOrThrow({ where: { id: media.id }, include: mediaInclude });
    });
    this.dispatchMails(mails);
    return created;
  }

  async update(user: JwtUser, id: string, input: MediaInput, files: Express.Multer.File[]) {
    if (user.role !== UserRole.TEACHER) throw new ForbiddenException();
    const mails: PendingMail[] = [];
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.media.findUnique({
        where: { id },
        include: { files: true, reviews: { include: { items: true } } },
      });
      if (!current) throw new NotFoundException();
      if (current.ownerId !== user.sub) throw new ForbiddenException();
      if (!(<MediaStatus[]>[
        MediaStatus.DRAFT,
        MediaStatus.REVISION,
        MediaStatus.ACADEMIC_REVISION,
        MediaStatus.ARCHIVED,
      ]).includes(current.status)) {
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
      if (input.submit) {
        assertMediaTransition(current.status, target, {
          actorRole: user.role,
          actorId: user.sub,
          ownerId: current.ownerId,
          assigneeId: current.assigneeId,
          hasCompleteMetadata: this.hasCompleteMetadata(merged),
          fileCount: current.files.length + files.length,
        });
      }
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
            // ไฟล์ที่แนบมารอบนี้เป็นของเวอร์ชันใหม่ ไฟล์เก่ายังอยู่ครบและคงเลขเวอร์ชันเดิมไว้
            create: files.map((file) => ({
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              version: nextVersion,
            })),
          },
        },
      });
      if (input.submit) {
        await tx.statusLog.create({
          data: { mediaId: id, actorId: user.sub, fromStatus: current.status, toStatus: target },
        });
        await this.notifyTransition(tx, { ...current, subjectGroup: merged.subjectGroup?.trim() || current.subjectGroup }, target, undefined, mails);
      }
      return tx.media.findUniqueOrThrow({ where: { id }, include: mediaInclude });
    });
    this.dispatchMails(mails);
    return updated;
  }

  mine(ownerId: string) {
    return this.prisma.media.findMany({ where: { ownerId }, include: mediaInclude, orderBy: { updatedAt: 'desc' } });
  }

  async publicList(query: PublicMediaQuery) {
    const search = query.q?.trim();
    const subjects = csvValues(query.subject);
    const grades = csvValues(query.grade);
    const where: Prisma.MediaWhereInput = {
      status: MediaStatus.APPROVED,
      ...(subjects.length ? { subject: { in: subjects } } : {}),
      ...(grades.length ? { gradeLevel: { in: grades } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
              { subjectGroup: { contains: search, mode: 'insensitive' } },
              { gradeLevel: { contains: search, mode: 'insensitive' } },
              { mediaType: { contains: search, mode: 'insensitive' } },
              { owner: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total, facetRows] = await Promise.all([
      this.prisma.media.findMany({
        where,
        include: publicMediaInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      this.prisma.media.count({ where }),
      this.prisma.media.findMany({
        where: { status: MediaStatus.APPROVED },
        select: { subject: true, gradeLevel: true },
        distinct: ['subject', 'gradeLevel'],
      }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      facets: {
        subjects: [...new Set(facetRows.map((item) => item.subject))],
        grades: [...new Set(facetRows.map((item) => item.gradeLevel))],
      },
    };
  }

  async one(id: string, user: JwtUser) {
    const media = await this.prisma.media.findUnique({ where: { id }, include: mediaInclude });
    if (!media) throw new NotFoundException();
    if (
      media.status === MediaStatus.APPROVED &&
      ((user.role === UserRole.TEACHER && media.ownerId !== user.sub) || user.role === UserRole.ADMIN)
    ) {
      return this.prisma.media.findUniqueOrThrow({ where: { id }, include: publicMediaInclude });
    }
    await this.assertCanRead(media, user);
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
    const mails: PendingMail[] = [];
    const result = await this.prisma.$transaction(async (tx) => {
      const media = await tx.media.findUnique({ where: { id }, include: { files: true } });
      if (!media) throw new NotFoundException();
      assertMediaTransition(media.status, to, {
        actorRole: user.role,
        actorId: user.sub,
        ownerId: media.ownerId,
        assigneeId: media.assigneeId,
        reason,
        fileCount: media.files.length,
      });
      if (media.status === MediaStatus.PENDING && to === MediaStatus.IN_REVIEW) {
        const reviewer = await tx.user.findUnique({ where: { id: user.sub }, select: { department: true } });
        if (!reviewer?.department || reviewer.department !== media.subjectGroup) throw new ForbiddenException();
        return this.applyTransition(tx, media, user, to, reason, mails, user.sub);
      }
      if (media.status === MediaStatus.IN_REVIEW && to === MediaStatus.PENDING) {
        return this.applyTransition(tx, media, user, to, reason, mails, null);
      }
      if (media.status === MediaStatus.APPROVED && to === MediaStatus.ARCHIVED) {
        return this.applyTransition(tx, media, user, to, reason, mails, null);
      }
      throw new BadRequestException('การเปลี่ยนสถานะนี้ต้องทำผ่านขั้นตอนที่กำหนด');
    });
    this.dispatchMails(mails);
    return result;
  }

  private async applyTransition(
    tx: Transaction,
    media: NotifiableMedia & { status: MediaStatus; assigneeId: string | null },
    user: JwtUser,
    to: MediaStatus,
    reason: string | undefined,
    mails: PendingMail[],
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
    await this.notifyTransition(tx, media, to, reason, mails);
    return tx.media.findUniqueOrThrow({ where: { id: media.id }, include: mediaInclude });
  }

  async saveReview(mediaId: string, user: JwtUser, payload: ReviewPayload, complete: boolean) {
    const mails: PendingMail[] = [];
    const result = await this.prisma.$transaction(async (tx) => {
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

      let review = await tx.review.findUnique({
        where: {
          mediaId_mediaVersion_reviewerId_stage: {
            mediaId,
            mediaVersion: media.version,
            reviewerId: user.sub,
            stage,
          },
        },
      });
      review = review
        ? await tx.review.update({ where: { id: review.id }, data: { summary: payload.summary?.trim() } })
        : await tx.review.create({
            data: {
              mediaId,
              mediaVersion: media.version,
              reviewerId: user.sub,
              stage,
              summary: payload.summary?.trim(),
            },
          });

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
      if (!complete) {
        return tx.review.findUniqueOrThrow({ where: { id: review.id }, include: { items: true } });
      }

      const items = await tx.reviewItem.findMany({ where: { reviewId: review.id } });
      const to = payload.to;
      if (!to) throw new BadRequestException('ไม่ได้ระบุผลการตัดสิน');
      const completeResults = REVIEW_TOPIC_IDS.every((topicId) => items.some((item) => item.topicId === topicId && item.result));
      const commentCount = items.filter((item) => item.comment?.trim()).length;
      const reason = payload.reason?.trim() || payload.summary?.trim();
      assertMediaTransition(media.status, to, {
        actorRole: user.role,
        actorId: user.sub,
        ownerId: media.ownerId,
        assigneeId: media.assigneeId,
        reason,
        commentCount,
        hasCompletedReview: completeResults,
      });

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
      return this.applyTransition(tx, media, user, to, reason, mails, to === MediaStatus.ACADEMIC_REVIEW ? null : media.assigneeId);
    });
    this.dispatchMails(mails);
    return result;
  }

  async remove(id: string, user: JwtUser) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: { files: { select: { path: true } } },
    });
    if (!media) throw new NotFoundException();
    if (media.ownerId !== user.sub || user.role !== UserRole.TEACHER || media.status !== MediaStatus.DRAFT) {
      throw new ForbiddenException();
    }
    await this.prisma.media.delete({ where: { id } });
    await removeStoredFiles(media.files.map((file) => file.path));
    return { ok: true };
  }

  async fileForDownload(mediaId: string, fileId: string, user: JwtUser) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId }, include: mediaInclude });
    if (!media) throw new NotFoundException();
    await this.assertCanRead(media, user);
    const file = await this.prisma.mediaFile.findFirst({ where: { id: fileId, mediaId } });
    if (!file) throw new NotFoundException();
    const uploadRoot = resolve(process.env.UPLOAD_DIR ?? 'uploads');
    const absolutePath = resolve(file.path);
    const relativePath = relative(uploadRoot, absolutePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) throw new ForbiddenException();
    if (!existsSync(absolutePath)) throw new NotFoundException('ไม่พบไฟล์ในระบบจัดเก็บ');
    await this.prisma.$transaction(async (tx) => {
      // downloadCount คือ "มีคนหยิบสื่อชิ้นนี้ไปใช้กี่คน" ไม่ใช่จำนวนครั้งที่กดปุ่ม
      // สื่อชุดหนึ่งมักมีหลายไฟล์ ถ้านับทุกไฟล์ คนเดียวโหลดครบชุดจะกลายเป็นหลายคน
      const previous = await tx.download.findFirst({ where: { mediaId, userId: user.sub } });
      await tx.download.create({ data: { mediaId, userId: user.sub } });
      if (!previous) {
        await tx.media.update({ where: { id: mediaId }, data: { downloadCount: { increment: 1 } } });
      }
    });
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
