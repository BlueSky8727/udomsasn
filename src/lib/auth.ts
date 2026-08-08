import { cookies } from 'next/headers';
import { PREVIEW_ROLE_COOKIE } from '@/constants/auth';
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

/**
 * TODO: อ่านจาก session + profiles
 *
 * ตั้ง UDOMSASN_PREVIEW_ROLE เป็น TEACHER, REVIEWER หรือ ADMIN เพื่อดูแต่ละบทบาท
 * ค่านี้อยู่ฝั่งเซิร์ฟเวอร์และมีไว้เฉพาะช่วงที่ระบบล็อกอินยังไม่เชื่อมต่อเท่านั้น
 */
export async function getViewerRole(): Promise<UserRole> {
  const previewLoginEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ALLOW_DEV_LOGIN === 'true';

  if (previewLoginEnabled) {
    const cookieStore = await cookies();
    const selectedRole = cookieStore.get(PREVIEW_ROLE_COOKIE)?.value.toUpperCase();
    if (selectedRole && Object.values(USER_ROLE).includes(selectedRole as UserRole)) {
      return selectedRole as UserRole;
    }
  }

  const previewRole = process.env.UDOMSASN_PREVIEW_ROLE?.toUpperCase();
  if (previewRole && Object.values(USER_ROLE).includes(previewRole as UserRole)) {
    return previewRole as UserRole;
  }
  return USER_ROLE.TEACHER;
}

/**
 * ชื่อผู้ใช้ที่กำลังเข้าใช้งาน — ใช้ตัดสินว่าใครเป็นเจ้าของสื่อชิ้นไหน
 *
 * TODO: อ่านจาก session + profiles แล้วเปลี่ยนไปเทียบด้วย id ไม่ใช่ชื่อ
 * ชื่อซ้ำกันได้และแก้ได้ จึงใช้เป็นกุญแจถาวรไม่ได้ ตอนนี้ข้อมูลตัวอย่างมีแค่ชื่อจึงใช้ไปก่อน
 */
export async function getViewerName(): Promise<string> {
  const role = await getViewerRole();
  return {
    [USER_ROLE.TEACHER]: 'อ.ปภาวี ศรีสุข',
    [USER_ROLE.REVIEWER]: 'อ.กิตติชัย',
    [USER_ROLE.ADMIN]: 'ผอ.วราภรณ์',
  }[role];
}

/**
 * กลุ่มสาระที่หัวหน้าวิชาการมอบหมายให้หัวหน้ากลุ่มสาระคนปัจจุบัน
 * TODO: อ่านจาก profiles.department_id แล้ว join departments ฝั่งเซิร์ฟเวอร์
 */
export async function getViewerSubjectGroup(): Promise<string | null> {
  const role = await getViewerRole();
  return role === USER_ROLE.REVIEWER ? 'วิทยาศาสตร์และเทคโนโลยี' : null;
}
