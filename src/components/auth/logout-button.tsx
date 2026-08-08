// src/components/auth/logout-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { signOut } from '@/lib/auth-client';

/**
 * ปุ่มออกจากระบบใน sidebar
 *
 * ยังไม่มี session ให้ล้างจนกว่าจะเชื่อม Supabase Auth แต่ปลายทางเหมือนกันทั้งสองกรณี
 * คือกลับไปหน้าล็อกอิน เมื่อเชื่อมแล้วจึงไม่ต้องแก้อะไรที่นี่ แก้ที่ signOut() ที่เดียว
 */
export function LogoutButton({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await signOut();
    onDone?.();
    // refresh ก่อน push เพื่อทิ้ง cache ของ server component ที่เรนเดอร์ไว้ตอนยังมี session
    router.refresh();
    router.push('/login');
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
