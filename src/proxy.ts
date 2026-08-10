import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/constants/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const isAuthApi = pathname.startsWith('/api/auth/');
  const isLogin = pathname === '/login';
  // ผู้สมัครกดลิงก์ยืนยันจากอีเมลตอนที่ยังล็อกอินไม่ได้ หน้านี้จึงต้องเปิดให้เข้าโดยไม่มี session
  const isVerifyEmail = pathname === '/verify-email';

  if (isLogin && hasSession) return NextResponse.redirect(new URL('/', request.url));
  if (!hasSession && !isLogin && !isAuthApi && !isVerifyEmail) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)'],
};
