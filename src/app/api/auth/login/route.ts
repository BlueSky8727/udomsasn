import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ACCESS_TOKEN_COOKIE, BACKEND_URL } from '@/lib/backend';
import { isSameOriginRequest, readJsonBody, RequestSecurityError, takeRateLimit } from '@/lib/request-security';

const LoginBody = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }
    const body = LoginBody.parse(await readJsonBody(request, 8 * 1024));
    const rateLimit = takeRateLimit(request, `login:${body.email.toLowerCase()}`, 10, 10 * 60 * 1_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'ลองเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }
    const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: 'no-store',
    });
    if (!backendResponse.ok) {
      // 403 = รหัสผ่านถูกแล้วแต่ติดเงื่อนไขบัญชี (ยังไม่ยืนยันอีเมล / รออนุมัติ / ถูกระงับ)
      // ต้องบอกเหตุผลจริง ไม่งั้นผู้ใช้ไม่รู้ว่าต้องทำอะไรต่อ
      // ส่วน 401 ตอบข้อความกลางเสมอ เพื่อไม่ให้ใช้หน้าล็อกอินไล่เดาว่ามีอีเมลนี้ในระบบไหม
      if (backendResponse.status === 403) {
        const data = (await backendResponse.json().catch(() => null)) as { message?: string } | null;
        return NextResponse.json(
          { error: data?.message ?? 'บัญชีนี้ยังเข้าใช้งานไม่ได้' },
          { status: 403 },
        );
      }
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }
    const data = (await backendResponse.json()) as { accessToken: string; user: unknown };
    const response = NextResponse.json({ user: data.user });
    // ไม่ตั้ง maxAge/expires โดยตั้งใจ — เป็น session cookie ที่หายไปเมื่อปิดเบราว์เซอร์
    // เครื่องในโรงเรียนใช้ร่วมกันหลายคน เปิดเว็บใหม่จึงต้องเจอหน้าล็อกอินเสมอ
    response.cookies.set(ACCESS_TOKEN_COOKIE, data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return response;
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' }, { status: 400 });
    }
    return NextResponse.json({ error: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' }, { status: 502 });
  }
}
