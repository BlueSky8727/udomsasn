'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icons';
import type { BackendNotification } from '@/types/backend';

export function NotificationCenter({ initialNotifications }: { initialNotifications: BackendNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = notifications.filter((item) => !item.readAt).length;
  const visible = unreadOnly ? notifications.filter((item) => !item.readAt) : notifications;

  const setRead = async (id: string, read: boolean) => {
    const response = await fetch(`/api/backend/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
    if (response.ok) {
      setNotifications((current) => current.map((item) =>
        item.id === id ? { ...item, readAt: read ? new Date().toISOString() : null } : item,
      ));
    }
  };

  const readAll = async () => {
    const response = await fetch('/api/backend/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (response.ok) {
      setNotifications((current) => current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })));
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setUnreadOnly(false)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${!unreadOnly ? 'bg-surface' : ''}`}>ทั้งหมด {notifications.length}</button>
          <button type="button" onClick={() => setUnreadOnly(true)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${unreadOnly ? 'bg-surface' : ''}`}>ยังไม่อ่าน {unread}</button>
        </div>
        <button type="button" disabled={!unread} onClick={() => void readAll()} className="text-xs font-semibold text-brand disabled:text-ink-faint">อ่านทั้งหมดแล้ว</button>
      </div>
      <div className="divide-y divide-line">
        {visible.map((item) => (
          <article key={item.id} className={`flex items-start gap-3 p-4 ${item.readAt ? '' : 'bg-brand/[.035]'}`}>
            <Link href={item.href ?? '/notifications'} onClick={() => void setRead(item.id, true)} className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{item.title}</h2>{!item.readAt && <span className="size-2 rounded-full bg-brand" />}</div>
              <p className="mt-1 text-xs leading-6 text-ink-muted">{item.message}</p>
              <p className="mt-2 text-[10px] text-ink-faint">{new Date(item.createdAt).toLocaleString('th-TH')}</p>
            </Link>
            <button type="button" onClick={() => void setRead(item.id, !Boolean(item.readAt))} className="grid size-8 place-items-center rounded-lg text-ink-faint">
              <Icon name={item.readAt ? 'message' : 'check'} className="size-4" />
            </button>
          </article>
        ))}
        {visible.length === 0 && <p className="py-16 text-center text-sm text-ink-faint">ไม่มีรายการแจ้งเตือน</p>}
      </div>
    </section>
  );
}
