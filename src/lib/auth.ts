import { USER_ROLE, type UserRole } from '@/constants/workflow';

/**
 * รอยต่อสำหรับระบบล็อกอิน — ตอนนี้ยังเป็นของชั่วคราว
 *
 * ยังไม่ได้ต่อ Supabase auth จึงคืนค่าคงที่ไว้ก่อนเพื่อให้พรีวิว UI ได้
 * เมื่อทำ auth เสร็จให้แก้แค่ไฟล์นี้ไฟล์เดียว: อ่าน session แล้ว join ตาราง profiles
 *
 * ห้ามใช้ค่าจากไฟล์นี้ไปตัดสินสิทธิ์จริงจนกว่าจะต่อ auth เสร็จ
 * และไม่ว่าจะต่อเสร็จหรือยัง การเช็คสิทธิ์ต้องทำฝั่งเซิร์ฟเวอร์เสมอ (กฎเหล็กข้อ 2)
 */

/** TODO: อ่านจาก session + profiles */
export async function getViewerRole(): Promise<UserRole> {
  return USER_ROLE.ADMIN;
}
