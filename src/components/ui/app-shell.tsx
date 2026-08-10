// src/components/ui/app-shell.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { LogoutButton } from '@/components/auth/logout-button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { canSeePrimaryAction, navItemsForRole, PRIMARY_ACTION } from '@/constants/navigation';
import { ROLE_LABELS, type UserRole } from '@/constants/workflow';
import { Icon } from './icons';
import { SchoolLogo } from './school-logo';
import { ThemeToggle } from './theme-toggle';

export function AppShell({ role, children, viewerName }: { role: UserRole; children: ReactNode; viewerName?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItemsForRole(role);
  const avatarLabel =
    role === 'TEACHER' ? 'อจ' : role === 'REVIEWER' ? 'ผต' : role === 'ACADEMIC_HEAD' ? 'วก' : 'AD';

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col px-4 py-4">
      <Link href="/" className="group flex shrink-0 items-center gap-3 rounded-xl px-2 py-1.5">
        <SchoolLogo className="size-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-[-0.02em] text-ink">Udomsasn Media</p>
          <p className="text-[11px] text-ink-faint">Teaching Library</p>
        </div>
      </Link>

      {canSeePrimaryAction(role) && (
        <Link
          href={PRIMARY_ACTION.href}
          onClick={() => setMobileOpen(false)}
          className="mt-5 flex shrink-0 items-center justify-center gap-2 rounded-xl border border-brand-strong/20 bg-brand px-4 py-3 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-strong"
        >
          <Icon name="upload" className="size-4" />
          {PRIMARY_ACTION.label}
        </Link>
      )}

      <div className="mt-5 shrink-0 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        เมนูหลัก
      </div>
      <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${active ? 'bg-brand/10 text-brand' : 'text-ink-muted hover:bg-panel hover:text-ink'}`}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg transition ${active ? 'bg-brand/10' : 'group-hover:bg-surface'}`}
              >
                <Icon name={item.icon} className="size-[18px]" />
              </span>
              <span className="flex-1">{item.label}</span>
              {active && <span className="size-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 shrink-0 space-y-1.5 border-t border-line/80 pt-3">
        <ThemeToggle />
        <LogoutButton onDone={() => setMobileOpen(false)} />
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          aria-label="เปิดข้อมูลของฉัน"
          className={`group flex items-center gap-3 rounded-xl border p-2 transition-colors ${
            pathname === '/profile'
              ? 'border-brand/20 bg-brand/8'
              : 'border-transparent bg-panel/70 hover:border-line hover:bg-panel'
          }`}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-brand/5 text-sm font-bold text-brand">
            {avatarLabel}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{viewerName ?? ROLE_LABELS[role]}</p>
            <p className="truncate text-[10px] text-ink-faint">{ROLE_LABELS[role]}</p>
          </div>
          <Icon
            name="chevronRight"
            className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
          />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-line/80 bg-sidebar/95 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="ปิดเมนู"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[290px] border-r border-line bg-sidebar shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line/70 bg-surface/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-xl border border-line text-ink-muted lg:hidden"
          >
            <Icon name="menu" className="size-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            {/* ผู้ดูแลระบบไม่มีส่วนในกระบวนการตรวจสื่อ จึงไม่มีการแจ้งเตือนให้ติดตาม */}
            {role !== 'ADMIN' && <NotificationBell role={role} />}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1460px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
