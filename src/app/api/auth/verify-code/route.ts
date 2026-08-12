import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BACKEND_URL } from '@/lib/backend';
import {
  isSameOriginRequest,
  readJsonBody,
  RequestSecurityError,
  takeRateLimit,
} from '@/lib/request-security';

const VerifyCodeBody = z.object({
  email: z.string().email().max(254),
  code: z.string().min(1).max(20),
});

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }
    const body = VerifyCodeBody.parse(await readJsonBody(request, 4 * 1024));
    // รหัสมีแค่ 6 หลัก ต้องกันการไล่ยิงเพิ่มอีกชั้นนอกเหนือจากตัวนับใน backend
    const limit = takeRateLimit(request, `auth-verify-code:${body.email.toLowerCase()}`, 15, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `กรอกรหัสถี่เกินไป กรุณารออีก ${limit.retryAfterSeconds} วินาที` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      );
    }
    const backendResponse = await fetch(`${BACKEND_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = (await backendResponse.json().catch(() => null)) as
      | { message?: string | string[]; alreadyVerified?: boolean }
      | null;
    if (!backendResponse.ok) {
      const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
      return NextResponse.json(
        { error: message ?? 'ยืนยันรหัสไม่สำเร็จ' },
        { status: backendResponse.status },
      );
    }
    return NextResponse.json(data ?? {});
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'รหัสยืนยันไม่ถูกต้อง' }, { status: 400 });
    }
    return NextResponse.json({ error: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' }, { status: 502 });
  }
}
