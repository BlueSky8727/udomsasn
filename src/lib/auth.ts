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

/**
 * ชื่อผู้ใช้ที่กำลังเข้าใช้งาน — ใช้ตัดสินว่าใครเป็นเจ้าของสื่อชิ้นไหน
 *
 * TODO: อ่านจาก session + profiles แล้วเปลี่ยนไปเทียบด้วย id ไม่ใช่ชื่อ
 * ชื่อซ้ำกันได้และแก้ได้ จึงใช้เป็นกุญแจถาวรไม่ได้ ตอนนี้ข้อมูลตัวอย่างมีแค่ชื่อจึงใช้ไปก่อน
 */
export async function getViewerName(): Promise<string> {
  return 'อ.ปภาวี ศรีสุข';
}
