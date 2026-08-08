// src/lib/auth-client.ts
'use client';

import { PREVIEW_ROLE_COOKIE } from '@/constants/auth';
import type { UserRole } from '@/constants/workflow';

/**
 * จุดต่อกับระบบยืนยันตัวตนฝั่งเบราว์เซอร์ — ที่เดียวที่ต้องแก้ตอนเชื่อม Supabase Auth
 *
 * ต้องเรียกจากเบราว์เซอร์เท่านั้น เพราะการเข้า/ออกจากระบบต้องตั้งและล้าง cookie ของ session
 * คู่กับ src/lib/auth.ts ที่เป็นฝั่งเซิร์ฟเวอร์ — ไฟล์นั้นอ่านว่า "ตอนนี้เป็นใคร"
 *
 * ห้ามใช้ผลจากไฟล์นี้ไปตัดสินสิทธิ์ การเช็คสิทธิ์ทุกครั้งต้องอ่าน session + ตาราง profiles
 * ฝั่งเซิร์ฟเวอร์เสมอ (กฎเหล็กข้อ 2) ฝั่งเบราว์เซอร์แก้ค่าอะไรก็ได้ จึงเชื่อไม่ได้
 */

export type Credentials = { email: string; password: string };

export type SignInOptions = {
  role: UserRole;
  remember: boolean;
};

export type SignInResult = { ok: true } | { ok: false; message: string };

/** ยังไม่ได้เชื่อม Supabase — ใช้ข้อความนี้เพื่อไม่ให้ UI เดาเองว่าล็อกอินสำเร็จ */
const NOT_CONNECTED = 'ยังไม่ได้เชื่อมระบบยืนยันตัวตน จึงยังเข้าสู่ระบบไม่ได้ในตอนนี้';

/**
 * โหมดชั่วคราวระหว่างพัฒนา: กรอกอีเมลกับรหัสผ่านอะไรก็ผ่าน
 *
 * **นี่ไม่ใช่การยืนยันตัวตน** ไม่มีการตรวจรหัสผ่าน ไม่มี session และไม่มีบทบาทจริง
 * เปิดไว้เพื่อให้เดินดูหน้าจอได้ก่อนที่ Supabase Auth จะพร้อม
 *
 * เปิดเองอัตโนมัติเฉพาะตอน dev ส่วน production build ต้องตั้ง NEXT_PUBLIC_ALLOW_DEV_LOGIN=true
 * เองเท่านั้นถึงจะทำงาน กันไม่ให้ทางลัดนี้ติดขึ้นเซิร์ฟเวอร์จริงโดยไม่ตั้งใจ
 *
 * ลบทั้งบล็อกนี้ทิ้งตอนเชื่อม Supabase Auth
 */
export const DEV_LOGIN_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === 'true';

/**
 * เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
 *
 * ของจริงจะเป็นประมาณนี้
 *   const supabase = createClient();                       // @/lib/supabase/browser
 *   const { error } = await supabase.auth.signInWithPassword(credentials);
 *   return error ? { ok: false, message: SIGN_IN_FAILED } : { ok: true };
 *
 * ห้ามส่งข้อความ error ดิบจาก Supabase ออกหน้าจอ และห้ามแยกว่าอีเมลผิดหรือรหัสผ่านผิด
 * เพราะจะกลายเป็นช่องให้ไล่เดาว่าอีเมลไหนมีบัญชีอยู่ในระบบ ใช้ข้อความเดียวเสมอ
 */
export async function signIn(
  credentials: Credentials,
  options: SignInOptions,
): Promise<SignInResult> {
  void credentials;
  if (DEV_LOGIN_ENABLED) {
    const maxAge = options.remember ? '; Max-Age=2592000' : '';
    document.cookie = `${PREVIEW_ROLE_COOKIE}=${encodeURIComponent(options.role)}; Path=/; SameSite=Lax${maxAge}`;
    return { ok: true };
  }
  return { ok: false, message: NOT_CONNECTED };
}

/**
 * ออกจากระบบ
 *
 * ของจริงคือ `await createClient().auth.signOut()` แล้วให้ผู้เรียก router.refresh()
 * เพื่อทิ้ง cache ของ server component ที่เรนเดอร์ไว้ตอนยังมี session
 *
 * ตอนนี้ยังไม่มี session ให้ล้าง จึงไม่ทำอะไร แต่ยังพาไปหน้าล็อกอินตามปกติ
 * เพราะปลายทางของการกดออกจากระบบไม่เปลี่ยนไม่ว่าจะเชื่อมแล้วหรือยัง
 */
export async function signOut(): Promise<void> {
  document.cookie = `${PREVIEW_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  return;
}
