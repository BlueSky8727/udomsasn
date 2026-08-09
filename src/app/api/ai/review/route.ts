// src/app/api/ai/review/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { screenWithTyphoon } from '@/lib/ai/typhoon';
import { REVIEW_JOBS } from '@/constants/enterprise-data';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import { canOpenReviewJob } from '@/lib/review-access';
import {
  isSameOriginRequest,
  readJsonBody,
  RequestSecurityError,
  takeRateLimit,
} from '@/lib/request-security';

const Body = z.object({
  jobId: z.string().min(1).max(80),
  title: z.string().min(1).max(300),
  metadata: z.string().max(20000),
  extractedText: z.string().min(1).max(60000),
});
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }

    const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);
    if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ADMIN) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ใช้ระบบคัดกรอง AI' }, { status: 403 });
    }

    const rateLimit = takeRateLimit(request, `ai-screen:${role}`, 10, 10 * 60 * 1_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'เรียกตรวจถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = Body.parse(await readJsonBody(request, 128 * 1_024));
    const job = REVIEW_JOBS.find((item) => item.id === body.jobId);
    if (!job || !canOpenReviewJob(job, role, subjectGroup)) {
      return NextResponse.json({ error: 'ไม่พบงานตรวจที่เข้าถึงได้' }, { status: 404 });
    }

    const result = await screenWithTyphoon(body);
    return NextResponse.json({ provider: 'typhoon', result, canChangeStatus: false });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ข้อมูลสำหรับคัดกรองไม่ถูกต้อง' }, { status: 400 });
    }

    console.error('AI screening failed', error);
    return NextResponse.json(
      { error: 'ระบบคัดกรอง AI ยังทำงานไม่ได้ กรุณาลองใหม่ภายหลัง' },
      { status: 502 },
    );
  }
}
