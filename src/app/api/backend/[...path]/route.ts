import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_URL } from '@/lib/backend';
import { isSameOriginRequest } from '@/lib/request-security';

const ALLOWED_PREFIXES = ['media', 'reviews', 'users', 'analytics', 'notifications'];

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const root = path[0];
  const isProfileEndpoint =
    root === 'auth' &&
    ((path[1] === 'me' && path.length === 2) ||
      (path[1] === 'avatar' && path.length === 3));
  if (!root || (!ALLOWED_PREFIXES.includes(root) && !isProfileEndpoint)) {
    return NextResponse.json({ error: 'ไม่อนุญาตปลายทางนี้' }, { status: 404 });
  }
  if (request.method !== 'GET' && !isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
  }
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const url = new URL(request.url);
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
  const backendResponse = await fetch(
    `${BACKEND_URL}/${path.map(encodeURIComponent).join('/')}${url.search}`,
    { method: request.method, headers, body, cache: 'no-store' },
  );
  const responseHeaders = new Headers();
  for (const name of ['content-type', 'content-disposition', 'content-length']) {
    const value = backendResponse.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
