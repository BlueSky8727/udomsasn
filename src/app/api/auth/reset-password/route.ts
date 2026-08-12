import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BACKEND_URL } from '@/lib/backend';
import {
  isSameOriginRequest,
  readJsonBody,
  RequestSecurityError,
  takeRateLimit,
} from '@/lib/request-security';

const ResetBody = z.object({
  email: z.string().email().max(254),
  code: z.string().min(1).max(20),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }
    const body = ResetBody.parse(await readJsonBody(request, 4 * 1024));
    // รหัสมีแค่ 6 หลัก และปลายทางนี้เปลี่ยนรหัสผ่านได้ ต้องกันการไล่ยิงเป็นพิเศษ
    const limit = takeRateLimit(request, `auth-reset:${body.email.toLowerCase()}`, 15, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `กรอกรหัสถี่เกินไป กรุณารออีก ${limit.retryAfterSeconds} วินาที` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      );
    }
    const backendResponse = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = (await backendResponse.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    if (!backendResponse.ok) {
      const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
      return NextResponse.json(
        { error: message ?? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ' },
        { status: backendResponse.status },
      );
    }
    return NextResponse.json(data ?? {});
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    return NextResponse.json({ error: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' }, { status: 502 });
  }
}
