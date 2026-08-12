// src/components/dashboard/system-admin-home.tsx
import Link from 'next/link';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { PageHeading } from '@/components/ui/page-heading';
import { ROLE_LABELS, USER_ROLE, type UserRole } from '@/constants/workflow';
import type { UserSearchPage } from '@/types/backend';

/**
 * แดชบอร์ดของผู้ดูแลระบบ
 *
 * ผู้ดูแลระบบไม่มีสิทธิ์ในกระบวนการตรวจสื่อ หน้านี้จึงพูดถึงเรื่องบัญชีอย่างเดียว
 * ไม่มีคิวตรวจและตัวเลขคุณภาพสื่อเหมือนแดชบอร์ดของหัวหน้าวิชาการ
 */

const COUNTED_ROLES: readonly UserRole[] = [
  USER_ROLE.TEACHER,
  USER_ROLE.REVIEWER,
  USER_ROLE.ACADEMIC_HEAD,
  USER_ROLE.ADMIN,
];

const EMPTY_SUMMARY: UserSearchPage['summary'] = {
  total: 0,
  pending: 0,
  assigned: 0,
  active: 0,
  unverified: 0,
  pendingUsers: [],
  activeByRole: { TEACHER: 0, REVIEWER: 0, ACADEMIC_HEAD: 0, ADMIN: 0 },
};

export function SystemAdminHome({ name, summary = EMPTY_SUMMARY }: { name: string; summary?: UserSearchPage['summary'] }) {
  const pending = summary.pendingUsers;

  return (
    <>
      <PageHeading
        eyebrow="System administration"
        title={`สวัสดี ${name}`}
        description="ดูแลบัญชีผู้ใช้และการแต่งตั้งตำแหน่ง การตรวจสื่อเป็นหน้าที่ของหัวหน้าวิชาการ"
      />

      {summary.pending > 0 && (
        <Link
          href="/admin"
          role="status"
          className="mb-5 flex gap-3 rounded-2xl border border-status-pending/35 bg-status-pending/10 p-4 transition hover:bg-status-pending/15"
        >
          <Icon name="bell" className="mt-0.5 size-5 shrink-0 text-status-pending" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              มีผู้สมัครใหม่ {summary.pending} คน รอแต่งตั้งตำแหน่ง
            </p>
            <p className="mt-1 text-xs leading-6 text-ink-muted">
              {pending
                .slice(0, 3)
                .map((user) => user.name)
                .join(' · ')}
              {summary.pending > 3 ? ` และอีก ${summary.pending - 3} คน` : ''} — กดเพื่อไปแต่งตั้งตำแหน่ง
            </p>
          </div>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="บุคลากรทั้งหมด"
          value={String(summary.total)}
          detail={`เปิดใช้งานแล้ว ${summary.active} บัญชี`}
          icon="users"
        />
        <Metric
          label="รอแต่งตั้งตำแหน่ง"
          value={String(summary.pending)}
          detail="ผู้สมัครที่ยังเข้าใช้งานไม่ได้"
          icon="inbox"
        />
        <Metric
          label="ยังไม่ยืนยันอีเมล"
          value={String(summary.unverified)}
          detail="รอผู้สมัครกดยืนยันเอง"
          icon="warning"
        />
      </div>

      <SectionCard className="mt-6" title="จำนวนตามตำแหน่ง">
        <div className="grid gap-3 sm:grid-cols-4">
          {COUNTED_ROLES.map((role) => (
            <div key={role} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[11px] text-ink-faint">{ROLE_LABELS[role]}</p>
              <p className="mt-1 text-2xl font-bold">
                {summary.activeByRole[role]}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {summary.pending > 0 && (
        <SectionCard className="mt-6" title="ผู้สมัครที่รอแต่งตั้ง">
          <ul className="divide-y divide-line">
            {pending.slice(0, 5).map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                    {user.email}
                    {user.emailVerifiedAt ? ' · ยืนยันอีเมลแล้ว' : ' · ยังไม่ยืนยันอีเมล'}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-faint">
                  {ROLE_LABELS[user.role]}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <Link
        href="/admin"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-strong"
      >
        ไปหน้าสมาชิกและตำแหน่ง
      </Link>
    </>
  );
}
