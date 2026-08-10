import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BACKEND_URL } from '@/lib/backend';
import { isSameOriginRequest, readJsonBody, RequestSecurityError } from '@/lib/request-security';

const VerifyBody = z.object({ token: z.string().min(1).max(200) });

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }
    const body = VerifyBody.parse(await readJsonBody(request, 4 * 1024));
    const backendResponse = await fetch(`${BACKEND_URL}/auth/verify-email`, {
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
        { error: message ?? 'ยืนยันอีเมลไม่สำเร็จ' },
        { status: backendResponse.status },
      );
    }
    return NextResponse.json(data ?? {});
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ลิงก์ยืนยันไม่ถูกต้อง' }, { status: 400 });
    }
    return NextResponse.json({ error: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' }, { status: 502 });
  }
}
