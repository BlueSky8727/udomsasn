// src/app/api/ai/review/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { screenWithTyphoon } from '@/lib/ai/typhoon';
import { USER_ROLE } from '@/constants/workflow';
import { getViewer } from '@/lib/auth';
import { backendFetch } from '@/lib/backend';
import type { BackendMedia } from '@/types/backend';
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
  extractedText: z.string().max(60000).optional().default(''),
});
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }

    const viewer = await getViewer();
    if (!viewer) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    const role = viewer.role;
    if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ACADEMIC_HEAD) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ใช้ระบบคัดกรอง AI' }, { status: 403 });
    }

    const rateLimit = takeRateLimit(request, `ai-screen:${viewer.id}`, 10, 10 * 60 * 1_000);
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
    let media: BackendMedia;
    try { media = await backendFetch<BackendMedia>(`/media/${body.jobId}`); } catch {
      return NextResponse.json({ error: 'ไม่พบงานตรวจที่เข้าถึงได้' }, { status: 404 });
    }

    const extraction = await backendFetch<{ text: string }>(`/media/${media.id}/extracted-text`);
    const extractedText = extraction.text || body.extractedText || media.description;
    const result = await screenWithTyphoon({
      title: media.title,
      metadata: JSON.stringify({ subject: media.subject, gradeLevel: media.gradeLevel, description: media.description, learningObjectives: media.learningObjectives }),
      extractedText,
    });
    await backendFetch(`/media/${media.id}/ai-reviews`, {
      method: 'POST',
      body: JSON.stringify({ provider: 'typhoon', result }),
    });
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
