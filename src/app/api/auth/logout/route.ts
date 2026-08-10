import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/backend';
import { isSameOriginRequest } from '@/lib/request-security';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}
