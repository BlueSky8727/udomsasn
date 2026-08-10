// src/constants/navigation.ts
import { USER_ROLE, type UserRole } from './workflow';
import type { IconName } from '@/components/ui/icons';
export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
  roles: readonly UserRole[];
};
const EVERYONE: readonly UserRole[] = [
  USER_ROLE.TEACHER,
  USER_ROLE.REVIEWER,
  USER_ROLE.ACADEMIC_HEAD,
  USER_ROLE.ADMIN,
];
/**
 * ผู้ดูแลระบบทำงานเรื่องบัญชีอย่างเดียว เมนูจึงเหลือแค่ภาพรวมกับหน้าสมาชิก
 * ส่วนคลังสื่อและการแจ้งเตือนเป็นเรื่องของฝั่งที่ทำงานกับสื่อ
 */
const MEDIA_SIDE: readonly UserRole[] = [
  USER_ROLE.TEACHER,
  USER_ROLE.REVIEWER,
  USER_ROLE.ACADEMIC_HEAD,
];
const TEACHER: readonly UserRole[] = [USER_ROLE.TEACHER];
const REVIEW: readonly UserRole[] = [USER_ROLE.REVIEWER, USER_ROLE.ACADEMIC_HEAD];
/** หัวหน้าวิชาการเปิดหน้ารายชื่อได้ แต่เห็นแบบอ่านอย่างเดียว ตั้งตำแหน่งไม่ได้ */
const MEMBER_LIST: readonly UserRole[] = [USER_ROLE.ADMIN, USER_ROLE.ACADEMIC_HEAD];
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'ภาพรวม', description: 'Dashboard', icon: 'home', roles: EVERYONE },
  {
    href: '/browse',
    label: 'คลังสื่อ',
    description: 'ค้นหาและนำสื่อไปใช้',
    icon: 'search',
    roles: MEDIA_SIDE,
  },
  {
    href: '/my-media',
    label: 'สื่อของฉัน',
    description: 'งานส่งและเวอร์ชัน',
    icon: 'folder',
    roles: TEACHER,
  },
  {
    href: '/feedback',
    label: 'ผลจากหัวหน้ากลุ่มสาระ',
    description: 'ความเห็นจากหัวหน้ากลุ่มสาระ',
    icon: 'message',
    roles: TEACHER,
  },
  {
    href: '/queue',
    label: 'คิวตรวจ',
    description: 'รับเรื่องและตรวจสื่อ',
    icon: 'inbox',
    roles: REVIEW,
  },
  {
    href: '/analytics',
    label: 'รายงาน QA',
    description: 'ตัวชี้วัดและการนำกลับใช้',
    icon: 'chart',
    roles: REVIEW,
  },
  {
    href: '/notifications',
    label: 'การแจ้งเตือน',
    description: 'ความเคลื่อนไหวทั้งหมด',
    icon: 'bell',
    roles: MEDIA_SIDE,
  },
  {
    href: '/admin',
    label: 'สมาชิกและตำแหน่ง',
    description: 'รายชื่อบุคลากรและการแต่งตั้ง',
    icon: 'users',
    roles: MEMBER_LIST,
  },
];
export const PRIMARY_ACTION = { href: '/submit', label: 'สร้างสื่อใหม่', roles: TEACHER } as const;
export const navItemsForRole = (role: UserRole) => NAV_ITEMS.filter((i) => i.roles.includes(role));
export const canSeePrimaryAction = (role: UserRole) => PRIMARY_ACTION.roles.includes(role);
