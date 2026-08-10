// src/components/auth/logout-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { signOut } from '@/lib/auth-client';

/**
 * ปุ่มออกจากระบบใน sidebar
 *
 * signOut() เรียก `POST /api/auth/logout` เพื่อล้างคุกกี้ session ฝั่งเซิร์ฟเวอร์
 * ตัวปุ่มไม่ต้องรู้กลไกเบื้องหลัง ถ้าเปลี่ยนวิธีจัดการ session ให้แก้ที่ signOut() ที่เดียว
 */
export function LogoutButton({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;

    setBusy(true);
    try {
      await signOut();
      onDone?.();
      // เปลี่ยนหน้าภายในแอปเพื่อให้ JavaScript ที่โหลดอยู่ทำงานต่อเนื่อง
      // และใช้ hard navigation เป็นทางสำรองเฉพาะเมื่อ router เปลี่ยนหน้าไม่สำเร็จ
      router.replace('/login');
      window.setTimeout(() => {
        if (window.location.pathname !== '/login') window.location.replace('/login');
      }, 1_000);
    } catch (error) {
      console.error('Unable to sign out', error);
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-panel hover:text-status-rejected disabled:opacity-60"
    >
      <Icon name="lock" className="size-[18px] shrink-0" />
      <span>{busy ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
    </button>
  );
}
