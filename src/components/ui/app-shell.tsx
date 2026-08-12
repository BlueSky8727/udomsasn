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

export function AppShell({
  role,
  children,
  viewerName,
  initialSearchQuery = '',
}: {
  role: UserRole;
  children: ReactNode;
  viewerName?: string;
  initialSearchQuery?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItemsForRole(role);
  const activeItem = items.find((item) =>
    item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const currentPage = pathname === '/profile' ? 'ข้อมูลของฉัน' : (activeItem?.label ?? 'ระบบคลังสื่อ');
  const displayName = viewerName ?? ROLE_LABELS[role];
  const avatarLabel =
    role === 'TEACHER' ? 'อจ' : role === 'REVIEWER' ? 'ผต' : role === 'ACADEMIC_HEAD' ? 'วก' : 'AD';

  const sidebar = (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden px-3.5 py-5 text-white">
      <div className="school-pattern-soft pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/5 to-transparent" />

      <Link
        href="/"
        onClick={() => setMobileOpen(false)}
        className="relative flex shrink-0 flex-col items-center px-3 text-center"
      >
        <SchoolLogo className="size-[86px] border-2 border-white/30 shadow-lg shadow-black/15" />
        <p className="mt-3 text-[17px] font-bold tracking-[-0.02em] text-white">Udomsasn Media QA</p>
        <p className="mt-1 text-[11px] text-white/65">ระบบคลังและตรวจสื่อการสอน</p>
      </Link>

      {canSeePrimaryAction(role) && (
        <Link
          href={PRIMARY_ACTION.href}
          onClick={() => setMobileOpen(false)}
          className="relative mt-5 flex shrink-0 items-center justify-center gap-2 rounded-md bg-coral px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-coral-strong"
        >
          <span className="grid size-5 place-items-center rounded-full bg-white text-coral">
            <Icon name="plus" className="size-3.5" />
          </span>
          {PRIMARY_ACTION.label}
        </Link>
      )}

      <nav className="relative mt-8 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
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
              className={`group relative flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-white/15 text-white shadow-sm' : 'text-white/75 hover:bg-white/8 hover:text-white'
              }`}
            >
              {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-coral" />}
              <span className={`grid size-7 place-items-center ${active ? 'text-white' : 'text-white/75'}`}>
                <Icon name={item.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-3 shrink-0 border-t border-white/10 pt-3">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="info" className="size-[18px]" />
          คู่มือและข้อมูลของฉัน
        </Link>
        <ThemeToggle variant="sidebar" />
        <LogoutButton variant="sidebar" onDone={() => setMobileOpen(false)} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="fixed inset-x-0 top-0 z-50 h-9 bg-gradient-to-r from-coral-strong to-coral text-white shadow-sm">
        <div className="flex h-full items-center px-4 text-[11px] sm:px-6 lg:pl-[274px] lg:pr-8">
          <span className="flex items-center gap-2 font-medium">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgb(110_231_183_/_0.12)]" />
            ระบบออนไลน์
          </span>
          <div className="ml-auto hidden items-center gap-4 text-white/90 sm:flex">
            <span>ต้องการความช่วยเหลือ?</span>
            <span>โทร. 073-288102</span>
            <span className="h-4 w-px bg-white/35" />
            <Link href="/profile" className="font-medium hover:text-white">ช่วยเหลือ</Link>
          </div>
        </div>
      </div>

      <aside className="fixed bottom-0 left-0 top-9 z-40 hidden w-[254px] bg-gradient-to-b from-navy to-navy-deep shadow-xl lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-9 z-50 lg:hidden">
          <button
            aria-label="ปิดเมนู"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[286px] bg-gradient-to-b from-navy to-navy-deep shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="pt-9 lg:pl-[254px]">
        <header className="sticky top-9 z-30 flex h-[68px] items-center gap-3 border-b border-line/80 bg-panel/95 px-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-7">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
            className="grid size-9 place-items-center rounded-lg border border-line text-ink-muted lg:hidden"
          >
            <Icon name="menu" className="size-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link href="/" className="grid size-8 shrink-0 place-items-center rounded-lg text-brand transition hover:bg-brand/8">
              <Icon name="home" className="size-[18px]" />
            </Link>
            {pathname !== '/' && <Icon name="chevronRight" className="size-4 shrink-0 text-ink-faint" />}
            <span className="truncate font-medium text-ink-muted">{currentPage}</span>
          </div>

          <form
            action={role === 'ADMIN' ? '/admin' : '/browse'}
            method="get"
            role="search"
            className="mx-auto hidden w-full max-w-[430px] md:block"
          >
            <label className="relative block">
              <span className="sr-only">ค้นหา</span>
              <input
                type="search"
                name="q"
                defaultValue={initialSearchQuery}
                placeholder={role === 'ADMIN' ? 'ค้นหาบุคลากร' : 'ค้นหาสื่อ ชื่อเรื่อง รายวิชา หรือผู้สร้าง'}
                className="h-10 w-full rounded-lg border border-line bg-surface/70 pl-4 pr-10 text-xs outline-none transition placeholder:text-ink-faint focus:border-brand/45 focus:bg-panel focus:ring-4 focus:ring-brand/5"
              />
              <button
                type="submit"
                aria-label={role === 'ADMIN' ? 'ค้นหาบุคลากร' : 'ค้นหาสื่อ'}
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-faint transition hover:bg-brand/8 hover:text-brand"
              >
                <Icon name="search" className="size-[17px]" />
              </button>
            </label>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {role !== 'ADMIN' && <NotificationBell role={role} />}
            <span className="hidden h-8 w-px bg-line sm:block" />
            <Link href="/profile" className="flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-surface">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-bold text-brand ring-1 ring-line">
                {avatarLabel}
              </span>
              <span className="hidden min-w-0 text-left xl:block">
                <span className="block max-w-36 truncate text-xs font-semibold text-ink">{displayName}</span>
                <span className="mt-0.5 block text-[10px] text-ink-faint">{ROLE_LABELS[role]}</span>
              </span>
              <Icon name="chevronRight" className="hidden size-3.5 rotate-90 text-ink-faint xl:block" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1580px] px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
