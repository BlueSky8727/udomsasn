'use client';

import { useMemo, useState } from 'react';
import { Pill } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { SUBJECTS } from '@/constants/media-options';
import { USER_ROLE, type UserRole } from '@/constants/workflow';

type AccountStatus = 'PENDING' | 'ACTIVE';
type UserFilter = 'ALL' | 'PENDING' | 'TEACHER' | 'REVIEWER';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  accountStatus: AccountStatus;
  role: Extract<UserRole, 'TEACHER' | 'REVIEWER'>;
  department: string;
};

const INITIAL_USERS: readonly ManagedUser[] = [
  {
    id: 'USR-0048',
    name: 'อ.ลลิตา พรหมมา',
    email: 'lalita@udomsasn.ac.th',
    registeredAt: 'วันนี้ 09:12',
    accountStatus: 'PENDING',
    role: USER_ROLE.TEACHER,
    department: 'ภาษาต่างประเทศ',
  },
  {
    id: 'USR-0047',
    name: 'อ.พีรพัฒน์ ชูใจ',
    email: 'peerapat@udomsasn.ac.th',
    registeredAt: 'วันนี้ 08:46',
    accountStatus: 'PENDING',
    role: USER_ROLE.TEACHER,
    department: 'สุขศึกษาและพลศึกษา',
  },
  {
    id: 'USR-0045',
    name: 'อ.สุชาดา แก้วคำ',
    email: 'suchada@udomsasn.ac.th',
    registeredAt: 'เมื่อวาน 15:20',
    accountStatus: 'PENDING',
    role: USER_ROLE.TEACHER,
    department: 'ศิลปะ',
  },
  {
    id: 'USR-0014',
    name: 'อ.กิตติชัย',
    email: 'kittichai@udomsasn.ac.th',
    registeredAt: '2 ส.ค. 2569',
    accountStatus: 'ACTIVE',
    role: USER_ROLE.REVIEWER,
    department: 'วิทยาศาสตร์และเทคโนโลยี',
  },
  {
    id: 'USR-0027',
    name: 'อ.วรรณา แสงทอง',
    email: 'wanna@udomsasn.ac.th',
    registeredAt: '1 ส.ค. 2569',
    accountStatus: 'ACTIVE',
    role: USER_ROLE.TEACHER,
    department: 'ภาษาไทย',
  },
  {
    id: 'USR-0032',
    name: 'อ.ธนวัฒน์ มณี',
    email: 'thanawat@udomsasn.ac.th',
    registeredAt: '31 ก.ค. 2569',
    accountStatus: 'ACTIVE',
    role: USER_ROLE.TEACHER,
    department: 'คณิตศาสตร์',
  },
];

const FILTERS: readonly { value: UserFilter; label: string }[] = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รอแต่งตั้ง' },
  { value: 'TEACHER', label: 'อาจารย์' },
  { value: 'REVIEWER', label: 'หัวหน้ากลุ่มสาระ' },
];

const selectClass =
  'rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-brand';

/**
 * หน้าพรีวิวการกำหนดบทบาท การบันทึกจริงต้องเป็น server action ที่ยืนยันว่า actor เป็น ADMIN
 * และเขียน audit log ทุกครั้ง ห้ามรับรองสิทธิ์จาก state ในคอมโพเนนต์นี้
 */
export function RoleAssignmentPanel() {
  const [users, setUsers] = useState<readonly ManagedUser[]>(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UserFilter>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  const pendingCount = users.filter((user) => user.accountStatus === 'PENDING').length;
  const reviewerCount = users.filter((user) => user.role === USER_ROLE.REVIEWER).length;

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th');

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        `${user.name} ${user.email} ${user.id}`.toLocaleLowerCase('th').includes(normalizedQuery);
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'PENDING' && user.accountStatus === 'PENDING') ||
        user.role === filter;

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, users]);

  const update = (id: string, change: Partial<ManagedUser>) => {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, ...change } : user)),
    );
    setNotice(null);
  };

  const confirmRole = (user: ManagedUser) => {
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? { ...item, accountStatus: 'ACTIVE' as const } : item,
      ),
    );
    setNotice(
      `แต่งตั้ง ${user.name} เป็น${
        user.role === USER_ROLE.REVIEWER ? 'หัวหน้ากลุ่มสาระ' : 'อาจารย์'
      } กลุ่มสาระ${user.department}แล้ว · โหมดพรีวิวยังไม่เขียนฐานข้อมูล`,
    );
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface/70 p-4">
          <p className="text-[11px] text-ink-faint">ผู้สมัครและบุคลากรทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-xl border border-status-pending/20 bg-status-pending/5 p-4">
          <p className="text-[11px] text-ink-faint">รอหัวหน้าวิชาการแต่งตั้ง</p>
          <p className="mt-1 text-2xl font-bold text-status-pending">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
          <p className="text-[11px] text-ink-faint">หัวหน้ากลุ่มสาระปัจจุบัน</p>
          <p className="mt-1 text-2xl font-bold text-brand">{reviewerCount}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 lg:max-w-sm">
          <Icon name="search" className="size-4 text-ink-faint" />
          <span className="sr-only">ค้นหาผู้สมัคร</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อ อีเมล หรือรหัสผู้ใช้"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-ink-faint"
          />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="กรองรายชื่อผู้สมัคร">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                filter === item.value
                  ? 'bg-brand text-brand-contrast'
                  : 'border border-line bg-panel text-ink-muted hover:border-brand/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="border-b border-line text-[11px] text-ink-faint">
            <tr>
              <th className="pb-3 font-semibold">ผู้สมัคร / บุคลากร</th>
              <th className="pb-3 font-semibold">วันที่สมัคร</th>
              <th className="pb-3 font-semibold">บทบาท</th>
              <th className="pb-3 font-semibold">กลุ่มสาระที่รับผิดชอบ</th>
              <th className="pb-3 font-semibold">สถานะ</th>
              <th className="pb-3 text-right font-semibold">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id} className="border-b border-line/70 last:border-0">
                <td className="py-4 pr-4">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {user.email} · {user.id}
                  </p>
                </td>
                <td className="py-4 pr-4 text-xs text-ink-muted">{user.registeredAt}</td>
                <td className="py-4 pr-4">
                  <select
                    aria-label={`บทบาทของ ${user.name}`}
                    className={selectClass}
                    value={user.role}
                    onChange={(event) =>
                      update(user.id, {
                        role: event.target.value as ManagedUser['role'],
                      })
                    }
                  >
                    <option value={USER_ROLE.TEACHER}>อาจารย์</option>
                    <option value={USER_ROLE.REVIEWER}>หัวหน้ากลุ่มสาระ</option>
                  </select>
                </td>
                <td className="py-4 pr-4">
                  <select
                    aria-label={`กลุ่มสาระของ ${user.name}`}
                    className={`${selectClass} max-w-64`}
                    value={user.department}
                    onChange={(event) => update(user.id, { department: event.target.value })}
                  >
                    {SUBJECTS.map((subject) => (
                      <option key={subject}>{subject}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 pr-4">
                  <Pill tone={user.accountStatus === 'PENDING' ? 'warn' : 'ok'}>
                    {user.accountStatus === 'PENDING' ? 'รอแต่งตั้ง' : 'เปิดใช้งานแล้ว'}
                  </Pill>
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => confirmRole(user)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                      user.accountStatus === 'PENDING'
                        ? 'bg-brand text-brand-contrast'
                        : 'border border-line bg-panel text-ink-muted'
                    }`}
                  >
                    {user.accountStatus === 'PENDING' ? 'ยืนยันบทบาท' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleUsers.length === 0 && (
          <div className="grid min-h-36 place-items-center text-center">
            <div>
              <p className="text-sm font-semibold">ไม่พบรายชื่อที่ค้นหา</p>
              <p className="mt-1 text-xs text-ink-faint">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 border-t border-line pt-4 text-[11px] leading-5 text-ink-faint">
        ผู้ที่ถูกแต่งตั้งเป็นหัวหน้ากลุ่มสาระจะเห็นเฉพาะสื่อที่อาจารย์ส่งเข้ากลุ่มสาระที่ระบุ
        และทุกการเปลี่ยนบทบาทจะถูกบันทึกไว้ตรวจสอบย้อนหลัง
      </p>
      {notice && (
        <p className="mt-3 rounded-xl border border-status-approved/20 bg-status-approved/5 p-3 text-xs text-ink-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
