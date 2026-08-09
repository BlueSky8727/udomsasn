'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { notificationsForRole } from '@/constants/notifications';
import type { UserRole } from '@/constants/workflow';
import { unreadNotificationCount } from '@/lib/notification-state';
import { Icon } from '@/components/ui/icons';
import { useNotificationState } from '@/components/notifications/use-notification-state';

export function NotificationBell({ role }: { role: UserRole }) {
  const notifications = useMemo(() => notificationsForRole(role), [role]);
  const overrides = useNotificationState(role);
  const unreadCount = unreadNotificationCount(notifications, overrides);

  const label =
    unreadCount > 0
      ? `เปิดการแจ้งเตือน มี ${unreadCount} รายการที่ยังไม่อ่าน`
      : 'เปิดการแจ้งเตือน ไม่มีรายการใหม่';

  return (
    <Link
      href="/notifications"
      aria-label={label}
      title={label}
      className="relative grid size-9 place-items-center rounded-xl border border-line/80 bg-panel/60 text-ink-muted transition-colors hover:border-brand/30 hover:text-brand"
    >
      <Icon name="bell" className="size-[18px]" />
      {unreadCount > 0 && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full border-2 border-surface bg-status-rejected px-1 text-[9px] font-bold leading-4 text-white shadow-sm"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
