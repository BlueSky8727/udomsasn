// src/components/ui/viewer-context.tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * ข้อมูลผู้ใช้ที่ล็อกอินอยู่ สำหรับคอมโพเนนต์ฝั่ง client ที่ต้องใช้ทุกหน้า (เช่น รูปโปรไฟล์บนแถบบน)
 *
 * layout เป็นผู้อ่านจาก session ฝั่งเซิร์ฟเวอร์แล้วส่งลงมา หน้าแต่ละหน้าจึงไม่ต้องส่ง prop ซ้ำ
 * ค่าที่ส่งลงมามีเท่าที่ใช้แสดงผลเท่านั้น ไม่มีสิทธิ์หรือ path ไฟล์จริง
 */
export type ViewerSummary = {
  id: string;
  name: string;
  hasAvatar: boolean;
  /** เปลี่ยนทุกครั้งที่บันทึกโปรไฟล์ ใช้ล้าง cache รูปเดิมของเบราว์เซอร์ */
  avatarVersion: string;
};

const ViewerContext = createContext<ViewerSummary | null>(null);

export function ViewerProvider({ viewer, children }: { viewer: ViewerSummary | null; children: ReactNode }) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export function useViewer(): ViewerSummary | null {
  return useContext(ViewerContext);
}

/** URL รูปโปรไฟล์ผ่าน proxy ของ Next ต้องล็อกอินอยู่เท่านั้นถึงจะเปิดได้ */
export function avatarUrlFor(viewer: ViewerSummary | null): string | null {
  if (!viewer?.hasAvatar) return null;
  const version = encodeURIComponent(viewer.avatarVersion);
  return `/api/backend/auth/avatar/${encodeURIComponent(viewer.id)}?v=${version}`;
}
