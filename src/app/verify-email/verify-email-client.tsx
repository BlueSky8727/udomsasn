// src/app/verify-email/verify-email-client.tsx
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icons';

/**
 * หน้าปลายทางของลิงก์ยืนยันอีเมล
 *
 * โทเคนอยู่ใน query string จึงต้องยิงจากฝั่ง client เพื่อไม่ให้โทเคนติดไปกับ log ของ server component
 */

type State =
  | { kind: 'working' }
  | { kind: 'done'; message: string }
  | { kind: 'failed'; message: string };

export function VerifyEmailClient({ token }: { token: string | null }) {
  const [state, setState] = useState<State>(() =>
    token ? { kind: 'working' } : { kind: 'failed', message: 'ลิงก์ยืนยันไม่ถูกต้อง ไม่พบโทเคน' },
  );
  // React 19 ใน dev รัน effect สองรอบ กันไม่ให้ยิงยืนยันซ้ำจนโทเคนถูกใช้ไปแล้ว
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    void (async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = (await response.json()) as { message?: string; error?: string };
        if (!response.ok) {
          setState({ kind: 'failed', message: data.error ?? 'ยืนยันอีเมลไม่สำเร็จ' });
          return;
        }
        setState({ kind: 'done', message: data.message ?? 'ยืนยันอีเมลเรียบร้อย' });
      } catch {
        setState({ kind: 'failed', message: 'เชื่อมต่อระบบสมาชิกไม่สำเร็จ' });
      }
    })();
  }, [token]);

  const tone =
    state.kind === 'done'
      ? { border: 'border-status-approved/30', bg: 'bg-status-approved/10', text: 'text-status-approved', icon: 'check' as const }
      : state.kind === 'failed'
        ? { border: 'border-status-rejected/30', bg: 'bg-status-rejected/10', text: 'text-status-rejected', icon: 'warning' as const }
        : { border: 'border-line', bg: 'bg-panel', text: 'text-ink-faint', icon: 'refresh' as const };

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-8 text-center">
      <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${tone.bg} ${tone.text}`}>
        <Icon name={tone.icon} className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">
        {state.kind === 'working' ? 'กำลังยืนยันอีเมล...' : state.kind === 'done' ? 'ยืนยันอีเมลสำเร็จ' : 'ยืนยันอีเมลไม่สำเร็จ'}
      </h1>
      <p className="mt-2 text-sm leading-7 text-ink-muted">
        {state.kind === 'working' ? 'กรุณารอสักครู่' : state.message}
      </p>
      {state.kind !== 'working' && (
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-strong"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      )}
    </div>
  );
}
