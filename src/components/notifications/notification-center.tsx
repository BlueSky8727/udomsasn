'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { notificationsForRole, type AppNotification } from '@/constants/notifications';
import type { UserRole } from '@/constants/workflow';
import {
  isNotificationRead,
  unreadNotificationCount,
  writeNotificationOverrides,
} from '@/lib/notification-state';
import { Icon } from '@/components/ui/icons';
import { TimeBadge } from '@/components/ui/enterprise';
import { useNotificationState } from '@/components/notifications/use-notification-state';

type Filter = 'all' | 'unread';

const toneClasses: Record<AppNotification['tone'], string> = {
  brand: 'bg-brand/10 text-brand',
  ok: 'bg-status-approved/10 text-status-approved',
  warn: 'bg-status-pending/10 text-status-pending',
  danger: 'bg-status-rejected/10 text-status-rejected',
};

export function NotificationCenter({ role }: { role: UserRole }) {
  const notifications = useMemo(() => notificationsForRole(role), [role]);
  const [filter, setFilter] = useState<Filter>('all');
  const overrides = useNotificationState(role);

  const unreadCount = unreadNotificationCount(notifications, overrides);
  const visibleNotifications =
    filter === 'unread'
      ? notifications.filter((notification) => !isNotificationRead(notification, overrides))
      : notifications;

  const setRead = (notificationId: string, read: boolean) => {
    const next = { ...overrides, [notificationId]: read };
    writeNotificationOverrides(role, next);
  };

  const markAllRead = () => {
    const next = { ...overrides };
    for (const notification of notifications) next[notification.id] = true;
    writeNotificationOverrides(role, next);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-line/80 bg-panel shadow-sm">
      <div className="flex flex-col gap-4 border-b border-line/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-2 rounded-xl bg-surface p-1" aria-label="กรองรายการแจ้งเตือน">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-panel text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            ทั้งหมด {notifications.length}
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            aria-pressed={filter === 'unread'}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              filter === 'unread' ? 'bg-panel text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            ยังไม่อ่าน {unreadCount}
          </button>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/8 disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent sm:self-auto"
        >
          <Icon name="check" className="size-3.5" />
          อ่านทั้งหมดแล้ว
        </button>
      </div>

      <div className="divide-y divide-line/80" aria-live="polite">
        {visibleNotifications.map((notification) => {
          const read = isNotificationRead(notification, overrides);
          return (
            <article
              key={notification.id}
              className={`relative flex items-start gap-2 p-3 transition-colors sm:p-4 ${
                read ? 'bg-panel' : 'bg-brand/[0.035]'
              }`}
            >
              {!read && (
                <span
                  className="absolute bottom-3 left-0 top-3 w-0.5 rounded-r-full bg-brand"
                  aria-hidden
                />
              )}

              <Link
                href={notification.href}
                onClick={() => setRead(notification.id, true)}
                className="group flex min-w-0 flex-1 items-start gap-3 rounded-xl p-2 outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 sm:gap-4 sm:p-3"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-11 ${toneClasses[notification.tone]}`}
                >
                  <Icon name={notification.icon} className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-sm ${read ? 'font-semibold' : 'font-bold'}`}>
                      {notification.title}
                    </h2>
                    {!read && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand">
                        <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                        ใหม่
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-ink-muted">
                    {notification.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <TimeBadge>{notification.time}</TimeBadge>
                    <span className="text-[10px] font-medium text-ink-faint group-hover:text-brand">
                      เปิดดูรายละเอียด
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevronRight"
                  className="mt-3 size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                />
              </Link>

              <button
                type="button"
                onClick={() => setRead(notification.id, !read)}
                aria-label={read ? `ทำ “${notification.title}” เป็นยังไม่อ่าน` : `ทำ “${notification.title}” เป็นอ่านแล้ว`}
                title={read ? 'ทำเป็นยังไม่อ่าน' : 'ทำเป็นอ่านแล้ว'}
                className="mt-2 grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <Icon name={read ? 'message' : 'check'} className="size-4" />
              </button>
            </article>
          );
        })}

        {visibleNotifications.length === 0 && (
          <div className="grid min-h-56 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-status-approved/10 text-status-approved">
                <Icon name="check" className="size-5" />
              </span>
              <p className="mt-4 text-sm font-semibold">อ่านรายการใหม่ครบแล้ว</p>
              <p className="mt-1 text-xs text-ink-faint">รายการที่อ่านแล้วทั้งหมดอยู่ในแท็บ “ทั้งหมด”</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
