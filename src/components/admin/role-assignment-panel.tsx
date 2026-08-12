'use client';

import { useMemo, useState } from 'react';
import { Pill } from '@/components/ui/enterprise';
import { SUBJECTS } from '@/constants/media-options';
import { ROLE_LABELS, USER_ROLE, type UserRole } from '@/constants/workflow';
import type { AccountStatus, BackendUser } from '@/types/backend';

/**
 * รายชื่อบุคลากรทั้งหมด ทั้งผู้ที่เพิ่งสมัครและผู้ที่ตั้งตำแหน่งแล้ว
 *
 * ผู้ดูแลระบบเท่านั้นที่แก้ไขได้ หัวหน้าวิชาการเปิดดูได้อย่างเดียว (`canEdit = false`)
 * การซ่อนปุ่มที่นี่เป็นแค่เรื่อง UI ฝั่งเซิร์ฟเวอร์ปฏิเสธ PATCH ของหัวหน้าวิชาการอยู่แล้ว (กฎเหล็กข้อ 2)
 */

/** ตำแหน่งที่ผู้ดูแลระบบแต่งตั้งผ่านหน้านี้ได้ — ตั้งเป็นผู้ดูแลระบบด้วยกันเองไม่ได้ */
const ASSIGNABLE_ROLES: readonly UserRole[] = [
  USER_ROLE.TEACHER,
  USER_ROLE.REVIEWER,
  USER_ROLE.ACADEMIC_HEAD,
];

const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: 'รอแต่งตั้ง',
  ACTIVE: 'ใช้งานอยู่',
  DISABLED: 'ระงับการใช้งาน',
};

const ROLE_TONE: Record<UserRole, string> = {
  TEACHER: 'border-line bg-surface text-ink-muted',
  REVIEWER: 'border-brand/30 bg-brand/10 text-brand',
  ACADEMIC_HEAD: 'border-status-approved/35 bg-status-approved/10 text-status-approved',
  ADMIN: 'border-status-pending/35 bg-status-pending/10 text-status-pending',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ROLE_TONE[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

export function RoleAssignmentPanel({
  initialUsers,
  canEdit,
  initialQuery = '',
}: {
  initialUsers: BackendUser[];
  canEdit: boolean;
  initialQuery?: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState(initialQuery);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const tokens = query.trim().toLocaleLowerCase('th').split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return users;
    return users.filter((user) => {
      const haystack = [
        user.name,
        user.email,
        user.phone,
        user.id,
        ROLE_LABELS[user.role],
        user.department,
        STATUS_LABELS[user.accountStatus],
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('th');
      return tokens.every((token) => haystack.includes(token));
    });
  }, [query, users]);

  const change = (id: string, patch: Partial<BackendUser>) =>
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...patch } : user)));

  const remove = async (user: BackendUser) => {
    // ลบถาวรกู้คืนไม่ได้ ต้องให้ยืนยันก่อนเสมอ
    const ok = window.confirm(
      `ลบบัญชีของ ${user.name} (${user.email}) ออกจากระบบถาวรหรือไม่?\n\nการลบนี้ย้อนกลับไม่ได้`,
    );
    if (!ok) return;
    setBusyId(user.id);
    setNotice(null);
    const response = await fetch(`/api/backend/users/${user.id}`, { method: 'DELETE' });
    const data = (await response.json()) as { message?: string; error?: string };
    if (response.ok) {
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setNotice(data.message ?? `ลบบัญชีของ ${user.name} เรียบร้อยแล้ว`);
    } else {
      setNotice(data.message ?? data.error ?? 'ลบบัญชีไม่สำเร็จ');
    }
    setBusyId(null);
  };

  const save = async (user: BackendUser) => {
    setBusyId(user.id);
    setNotice(null);
    const response = await fetch(`/api/backend/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: user.role,
        department: user.department,
        accountStatus: user.accountStatus === 'PENDING' ? 'ACTIVE' : user.accountStatus,
      }),
    });
    const data = (await response.json()) as BackendUser & { message?: string; error?: string };
    if (response.ok) {
      change(user.id, data);
      setNotice(`ตั้ง ${data.name} เป็น${ROLE_LABELS[data.role]} เรียบร้อยแล้ว`);
    } else {
      setNotice(data.message ?? data.error ?? 'บันทึกไม่สำเร็จ');
    }
    setBusyId(null);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาชื่อ อีเมล เบอร์โทร ตำแหน่ง หรือกลุ่มสาระ"
          className="w-full max-w-sm rounded-xl border border-line bg-surface px-3 py-2.5 text-xs outline-none focus:border-brand/45"
        />
        <p className="text-[11px] text-ink-faint">
          แสดง {visible.length} จาก {users.length} คน
        </p>
      </div>

      {!canEdit && (
        <p className="mb-4 rounded-xl border border-line bg-panel p-3 text-[11px] leading-5 text-ink-faint">
          คุณเปิดดูรายชื่อและตำแหน่งได้ แต่การตั้งตำแหน่งเป็นสิทธิ์ของผู้ดูแลระบบเท่านั้น
        </p>
      )}

      <div className="overflow-x-auto">
        <table className={`w-full text-left text-xs ${canEdit ? 'min-w-[880px]' : 'min-w-[620px]'}`}>
          <thead>
            <tr className="border-b border-line text-ink-faint">
              <th className="pb-3 font-medium">บุคลากร</th>
              <th className="pb-3 font-medium">{canEdit ? 'ตั้งตำแหน่ง' : 'ตำแหน่ง'}</th>
              <th className="pb-3 font-medium">กลุ่มสาระ</th>
              <th className="pb-3 font-medium">สถานะ</th>
              {canEdit && <th className="pb-3 text-right font-medium">ดำเนินการ</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id} className="border-b border-line/70">
                <td className="py-4 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{user.name}</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {user.email}
                    {user.emailVerifiedAt ? '' : ' · ยังไม่ยืนยันอีเมล'}
                  </p>
                </td>
                <td className="pr-3">
                  {canEdit && user.role !== USER_ROLE.ADMIN ? (
                    <select
                      value={user.role}
                      onChange={(event) =>
                        change(user.id, { role: event.target.value as UserRole })
                      }
                      aria-label={`ตำแหน่งของ ${user.name}`}
                      className="rounded-lg border border-line bg-surface px-2 py-2"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-ink-muted">{ROLE_LABELS[user.role]}</span>
                  )}
                </td>
                <td className="pr-3">
                  {canEdit && user.role !== USER_ROLE.ADMIN ? (
                    <select
                      value={user.department ?? ''}
                      onChange={(event) =>
                        change(user.id, { department: event.target.value || null })
                      }
                      aria-label={`กลุ่มสาระของ ${user.name}`}
                      className="max-w-64 rounded-lg border border-line bg-surface px-2 py-2"
                    >
                      <option value="">ไม่กำหนด</option>
                      {SUBJECTS.map((subject) => (
                        <option key={subject}>{subject}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-ink-muted">{user.department ?? '—'}</span>
                  )}
                </td>
                <td className="pr-3">
                  <Pill
                    tone={
                      user.accountStatus === 'ACTIVE'
                        ? 'ok'
                        : user.accountStatus === 'DISABLED'
                          ? 'danger'
                          : 'warn'
                    }
                  >
                    {STATUS_LABELS[user.accountStatus]}
                  </Pill>
                </td>
                {canEdit && (
                  <td className="text-right">
                    {user.role === USER_ROLE.ADMIN ? (
                      <span className="text-[11px] text-ink-faint">แก้ไขไม่ได้</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => void save(user)}
                          className="rounded-lg bg-brand px-3 py-2 font-semibold text-brand-contrast transition hover:bg-brand-strong disabled:opacity-50"
                        >
                          {busyId === user.id ? 'กำลังบันทึก' : 'บันทึก'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => void remove(user)}
                          title="ลบบัญชีออกจากระบบถาวร"
                          className="rounded-lg border border-status-rejected/40 px-3 py-2 font-semibold text-status-rejected transition hover:bg-status-rejected/10 disabled:opacity-50"
                        >
                          ลบ
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="py-12 text-center text-ink-faint">
                  ไม่พบบุคลากรที่ตรงกับคำค้น
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-surface p-3 text-xs text-ink-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
