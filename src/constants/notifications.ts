import type { IconName } from '@/components/ui/icons';
import { USER_ROLE, type UserRole } from '@/constants/workflow';

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  href: string;
  icon: IconName;
  tone: 'brand' | 'ok' | 'warn' | 'danger';
  roles: readonly UserRole[];
  /** สถานะตั้งต้นของข้อมูลตัวอย่าง ก่อนที่ผู้ใช้จะกดเปลี่ยนในเครื่องนี้ */
  initiallyRead: boolean;
};

export const APP_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'teacher-revision-med-0245',
    title: 'หัวหน้ากลุ่มสาระส่งกลับให้แก้ไข',
    description: '“อ่านจับใจความจากเรื่องสั้น” มีข้อเสนอแนะเรื่องเกณฑ์ประเมินและแหล่งที่มา',
    time: '5 นาที',
    href: '/my-media/MED-0245',
    icon: 'edit',
    tone: 'warn',
    roles: [USER_ROLE.TEACHER],
    initiallyRead: false,
  },
  {
    id: 'teacher-academic-revision-med-0246',
    title: 'หัวหน้าวิชาการขอให้แก้ไขเล็กน้อย',
    description: '“การเปลี่ยนสถานะของสสาร” ต้องปรับตัวอักษรและคำสะกดก่อนส่งตรวจอีกครั้ง',
    time: '38 นาที',
    href: '/my-media/MED-0246',
    icon: 'message',
    tone: 'warn',
    roles: [USER_ROLE.TEACHER],
    initiallyRead: false,
  },
  {
    id: 'teacher-approved-med-0248',
    title: 'สื่อผ่านการอนุมัติแล้ว',
    description: '“การเดินทางของหยดน้ำ” เผยแพร่เข้าคลังสื่อเรียบร้อยแล้ว',
    time: '2 ชม.',
    href: '/my-media/MED-0248',
    icon: 'check',
    tone: 'ok',
    roles: [USER_ROLE.TEACHER],
    initiallyRead: true,
  },
  {
    id: 'teacher-download-med-0248',
    title: 'มีการนำสื่อของคุณไปใช้',
    description: '“การเดินทางของหยดน้ำ” ถูกดาวน์โหลดเพื่อนำไปใช้สอนเพิ่ม 8 ครั้ง',
    time: 'เมื่อวาน',
    href: '/my-media/MED-0248',
    icon: 'download',
    tone: 'brand',
    roles: [USER_ROLE.TEACHER],
    initiallyRead: true,
  },
  {
    id: 'reviewer-new-job-med-260807-015',
    title: 'มีงานใหม่เข้าคิวกลุ่มสาระ',
    description: '“ระบบนิเวศและสายใยอาหาร” รอหัวหน้ากลุ่มสาระรับเรื่องตรวจ',
    time: '9 นาที',
    href: '/review/MED-260807-015',
    icon: 'inbox',
    tone: 'brand',
    roles: [USER_ROLE.REVIEWER],
    initiallyRead: false,
  },
  {
    id: 'reviewer-assigned-med-260807-014',
    title: 'งานตรวจที่คุณรับไว้ใกล้ครบเวลา',
    description: 'ตรวจ “วงจรไฟฟ้ากระแสตรง: ชุดกิจกรรมทดลอง” ต่อให้เสร็จภายในเวลาที่กำหนด',
    time: '18 นาที',
    href: '/review/MED-260807-014',
    icon: 'clock',
    tone: 'warn',
    roles: [USER_ROLE.REVIEWER],
    initiallyRead: false,
  },
  {
    id: 'reviewer-ai-med-260807-014',
    title: 'AI คัดกรองเบื้องต้นเสร็จแล้ว',
    description: 'พบ 1 จุดที่ควรตรวจเพิ่มเติมเรื่องแหล่งที่มาของภาพประกอบ',
    time: '45 นาที',
    href: '/review/MED-260807-014',
    icon: 'sparkles',
    tone: 'brand',
    roles: [USER_ROLE.REVIEWER],
    initiallyRead: true,
  },
  {
    id: 'admin-academic-review-med-260807-010',
    title: 'มีสื่อรอตรวจขั้นสุดท้าย',
    description: '“การสังเคราะห์ด้วยแสง” ผ่านหัวหน้ากลุ่มสาระและพร้อมให้หัวหน้าวิชาการตรวจ',
    time: '26 นาที',
    href: '/review/MED-260807-010',
    icon: 'shield',
    tone: 'brand',
    roles: [USER_ROLE.ADMIN],
    initiallyRead: false,
  },
  {
    id: 'admin-new-applicants',
    title: 'มีผู้สมัครรอแต่งตั้งบทบาท',
    description: 'มีบัญชีใหม่ 3 รายการที่ต้องตรวจสอบและกำหนดบทบาท',
    time: '1 ชม.',
    href: '/admin',
    icon: 'users',
    tone: 'warn',
    roles: [USER_ROLE.ADMIN],
    initiallyRead: false,
  },
  {
    id: 'admin-monthly-report',
    title: 'รายงานประจำเดือนพร้อมตรวจสอบ',
    description: 'สรุปการส่งสื่อ อัตราการอนุมัติ และการนำสื่อกลับไปใช้พร้อมแล้ว',
    time: 'เมื่อวาน',
    href: '/analytics',
    icon: 'chart',
    tone: 'ok',
    roles: [USER_ROLE.ADMIN],
    initiallyRead: true,
  },
];

export function notificationsForRole(role: UserRole): AppNotification[] {
  return APP_NOTIFICATIONS.filter((notification) => notification.roles.includes(role));
}
