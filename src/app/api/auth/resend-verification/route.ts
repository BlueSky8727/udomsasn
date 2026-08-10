import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BACKEND_URL } from '@/lib/backend';
import {
  isSameOriginRequest,
  readJsonBody,
  RequestSecurityError,
  takeRateLimit,
} from '@/lib/request-security';

const ResendBody = z.object({ email: z.string().email().max(254) });

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }
    // ปลายทางนี้สั่งให้ระบบส่งอีเมล จึงต้องจำกัดจำนวนครั้งเข้มกว่าปกติ
    const limit = takeRateLimit(request, 'auth-resend', 3, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `ขอลิงก์ถี่เกินไป กรุณารออีก ${limit.retryAfterSeconds} วินาที` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      );
    }
    const body = ResendBody.parse(await readJsonBody(request, 4 * 1024));
    const backendResponse = await fetch(`${BACKEND_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = (await backendResponse.json().catch(() => null)) as { message?: string } | null;
    if (!backendResponse.ok) {
      return NextResponse.json({ error: 'ส่งลิงก์ยืนยันไม่สำเร็จ' }, { status: backendResponse.status });
    }
    return NextResponse.json(data ?? {});
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }
    return NextResponse.json({ error: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' }, { status: 502 });
  }
}
