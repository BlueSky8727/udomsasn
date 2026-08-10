import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';
import { isSameOriginRequest, takeRateLimit } from '@/lib/request-security';

/** รูปโปรไฟล์จำกัด 2MB ที่ NestJS เผื่อส่วนหัวของ multipart อีกเล็กน้อย */
const MAX_BODY_BYTES = 3 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
  }
  // การสมัครทำให้ระบบส่งอีเมลออก จึงต้องกันไม่ให้ยิงรัวจาก IP เดียว
  const limit = takeRateLimit(request, 'auth-register', 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `สมัครถี่เกินไป กรุณารออีก ${limit.retryAfterSeconds} วินาที` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'ไฟล์รูปโปรไฟล์ใหญ่เกินกำหนด' }, { status: 413 });
  }

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'ไฟล์รูปโปรไฟล์ใหญ่เกินกำหนด' }, { status: 413 });
    }
    const contentType = request.headers.get('content-type');
    const backendResponse = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: contentType ? { 'Content-Type': contentType } : undefined,
      body,
      cache: 'no-store',
    });
    const data = (await backendResponse.json().catch(() => null)) as
      | { message?: string | string[]; email?: string; emailSent?: boolean }
      | null;
    if (!backendResponse.ok) {
      // class-validator ส่ง message กลับมาเป็น array เมื่อผิดหลายข้อ
      const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
      return NextResponse.json(
        { error: message ?? 'สมัครสมาชิกไม่สำเร็จ' },
        { status: backendResponse.status },
      );
    }
    return NextResponse.json(data ?? {});
  } catch {
    return NextResponse.json({ error: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' }, { status: 502 });
  }
}
