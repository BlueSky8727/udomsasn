'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/constants/workflow';
import { Icon } from '@/components/ui/icons';

export function NotificationBell({ role }: { role: UserRole }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    fetch('/api/backend/notifications/unread-count')
      .then((response) => response.ok ? response.json() : { count: 0 })
      .then((data: { count: number }) => { if (active) setCount(data.count); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [role]);
  const label = count ? `มีการแจ้งเตือนใหม่ ${count} รายการ` : 'ไม่มีการแจ้งเตือนใหม่';
  return <Link href="/notifications" aria-label={label} title={label} className="relative grid size-9 place-items-center rounded-xl border border-line bg-panel text-ink-muted"><Icon name="bell" className="size-[18px]"/>{count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-status-rejected px-1 text-[9px] font-bold leading-4 text-white">{count > 9 ? '9+' : count}</span>}</Link>;
}
