/**
 * theme.ts — ค่าคงที่ของธีม
 *
 * ต้องอยู่ในไฟล์ที่ไม่มี 'use client' เพราะทั้ง layout ฝั่งเซิร์ฟเวอร์
 * และปุ่มสลับธีมฝั่ง client ต้องใช้คีย์เดียวกัน
 * ถ้า export จากไฟล์ 'use client' ฝั่งเซิร์ฟเวอร์จะได้ client reference ไม่ใช่ค่าจริง
 */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'udomsasn-theme';

export const DEFAULT_THEME: Theme = 'light';
