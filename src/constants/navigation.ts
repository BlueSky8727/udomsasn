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
const ALL: readonly UserRole[] = [USER_ROLE.TEACHER, USER_ROLE.REVIEWER, USER_ROLE.ADMIN];
const TEACHER: readonly UserRole[] = [USER_ROLE.TEACHER];
const REVIEW: readonly UserRole[] = [USER_ROLE.REVIEWER, USER_ROLE.ADMIN];
const ADMIN: readonly UserRole[] = [USER_ROLE.ADMIN];
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'ภาพรวม', description: 'Dashboard', icon: 'home', roles: ALL },
  {
    href: '/browse',
    label: 'คลังสื่อ',
    description: 'ค้นหาและนำสื่อไปใช้',
    icon: 'search',
    roles: ALL,
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
    roles: ALL,
  },
  {
    href: '/admin',
    label: 'จัดการระบบ',
    description: 'ผู้ใช้ เกณฑ์ และการตั้งค่า',
    icon: 'settings',
    roles: ADMIN,
  },
];
export const PRIMARY_ACTION = { href: '/submit', label: 'สร้างสื่อใหม่', roles: TEACHER } as const;
export const navItemsForRole = (role: UserRole) => NAV_ITEMS.filter((i) => i.roles.includes(role));
export const canSeePrimaryAction = (role: UserRole) => PRIMARY_ACTION.roles.includes(role);
