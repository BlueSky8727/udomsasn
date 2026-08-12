import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { MediaStatus, UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async summary(@Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.REVIEWER && request.user.role !== UserRole.ACADEMIC_HEAD) throw new ForbiddenException();
    const since = new Date();
    since.setMonth(since.getMonth() - 11, 1);
    since.setHours(0, 0, 0, 0);
    const [all, approved, pending, downloads, users, media, statusLogs, completedReviews, recentStatusLogs] = await Promise.all([
      this.prisma.media.count(),
      this.prisma.media.count({ where: { status: MediaStatus.APPROVED } }),
      this.prisma.media.count({ where: { status: { in: [MediaStatus.PENDING, MediaStatus.IN_REVIEW, MediaStatus.ACADEMIC_REVIEW] } } }),
      this.prisma.download.count(),
      this.prisma.user.count(),
      this.prisma.media.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true } }),
      this.prisma.statusLog.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, toStatus: true, reason: true } }),
      this.prisma.review.findMany({
        where: { completedAt: { gte: since } },
        select: { createdAt: true, completedAt: true },
      }),
      this.prisma.statusLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          createdAt: true,
          fromStatus: true,
          toStatus: true,
          reason: true,
          actor: { select: { name: true } },
          media: { select: { code: true, title: true } },
        },
      }),
    ]);
    const monthly = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(since.getFullYear(), since.getMonth() + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return { month: key, submitted: 0, approved: 0 };
    });
    for (const item of media) {
      const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthly.find((entry) => entry.month === key);
      if (bucket) bucket.submitted += 1;
    }
    for (const log of statusLogs) {
      if (log.toStatus !== MediaStatus.APPROVED) continue;
      const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthly.find((entry) => entry.month === key);
      if (bucket) bucket.approved += 1;
    }
    const reasonCounts = new Map<string, number>();
    for (const log of statusLogs) {
      if (!(<MediaStatus[]>[MediaStatus.REVISION, MediaStatus.ACADEMIC_REVISION, MediaStatus.REJECTED]).includes(log.toStatus)) continue;
      const label = log.reason?.trim() || 'ไม่ได้ระบุเหตุผล';
      reasonCounts.set(label, (reasonCounts.get(label) ?? 0) + 1);
    }
    const reviewDurations = completedReviews.flatMap((review) => {
      if (!review.completedAt) return [];
      const duration = review.completedAt.getTime() - review.createdAt.getTime();
      return duration >= 0 ? [duration] : [];
    });
    const averageReviewHours = reviewDurations.length
      ? Math.round((reviewDurations.reduce((sum, duration) => sum + duration, 0) / reviewDurations.length / 3_600_000) * 10) / 10
      : 0;
    return {
      all,
      approved,
      pending,
      downloads,
      users,
      approvalRate: all ? Math.round((approved / all) * 100) : 0,
      averageReviewHours,
      monthly,
      revisionReasons: [...reasonCounts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      timeline: recentStatusLogs.map((log) => ({
        createdAt: log.createdAt,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        reason: log.reason,
        actorName: log.actor.name,
        mediaCode: log.media.code,
        mediaTitle: log.media.title,
      })),
    };
  }
}
