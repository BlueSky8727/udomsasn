import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

type BucketRow = { count: number; resetAt: Date };

@Injectable()
export class RateLimitService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async consume(
    scope: string,
    identity: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    const key = createHash('sha256').update(`${scope}:${identity}`).digest('hex');
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);
    await this.prisma.rateLimitBucket.deleteMany({
      where: { resetAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1_000) } },
    });
    const rows = await this.prisma.$queryRaw<BucketRow[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${resetAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
          ELSE "RateLimitBucket"."resetAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "resetAt"
    `;
    const bucket = rows[0];
    if (!bucket) return { allowed: false, retryAfterSeconds: 1 };
    return {
      allowed: bucket.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1_000)),
    };
  }
}
