'use client';

export type Credentials = { email: string; password: string };
/** ไม่มี role เพราะตำแหน่งมาจากที่ผู้ดูแลระบบตั้งไว้ ไม่ใช่สิ่งที่ผู้ใช้เลือกตอนล็อกอิน */
export type SignInOptions = { remember: boolean };
export type SignInResult = { ok: true } | { ok: false; message: string };

export async function signIn(
  credentials: Credentials,
  options: SignInOptions,
): Promise<SignInResult> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials, remember: options.remember }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      return { ok: false, message: data.error ?? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Backend ไม่สำเร็จ' };
  }
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar: File;
};
export type RegisterResult =
  | { ok: true; email: string; emailSent: boolean }
  | { ok: false; message: string };

/** ส่งเป็น multipart เพราะมีรูปโปรไฟล์ติดไปด้วย ฝั่งเซิร์ฟเวอร์ตรวจซ้ำทุกฟิลด์ (กฎเหล็กข้อ 2) */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  try {
    const body = new FormData();
    body.set('name', input.name);
    body.set('email', input.email);
    body.set('phone', input.phone);
    body.set('password', input.password);
    body.set('avatar', input.avatar);

    const response = await fetch('/api/auth/register', { method: 'POST', body });
    const data = (await response.json()) as {
      error?: string;
      email?: string;
      emailSent?: boolean;
    };
    if (!response.ok) return { ok: false, message: data.error ?? 'สมัครสมาชิกไม่สำเร็จ' };
    return { ok: true, email: data.email ?? input.email, emailSent: data.emailSent !== false };
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Backend ไม่สำเร็จ' };
  }
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) return { ok: false, message: data.error ?? 'ยืนยันรหัสไม่สำเร็จ' };
    return { ok: true };
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Backend ไม่สำเร็จ' };
  }
}

export async function forgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) return { ok: false, message: data.error ?? 'ขอรหัสไม่สำเร็จ' };
    return { ok: true, message: data.message ?? 'ส่งรหัสให้แล้ว' };
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Backend ไม่สำเร็จ' };
  }
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) return { ok: false, message: data.error ?? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ' };
    return { ok: true };
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Backend ไม่สำเร็จ' };
  }
}

export async function resendVerification(email: string): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) return { ok: false, message: data.error ?? 'ส่งลิงก์ยืนยันไม่สำเร็จ' };
    return { ok: true, message: data.message ?? 'ส่งลิงก์ยืนยันให้แล้ว' };
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Backend ไม่สำเร็จ' };
  }
}
