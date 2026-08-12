import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { RoleAssignmentPanel } from '@/components/admin/role-assignment-panel';
import { USER_ROLE } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { getViewerRole } from '@/lib/auth';
import type { BackendUser } from '@/types/backend';

/**
 * หน้าสมาชิกและตำแหน่ง
 *
 * ผู้ดูแลระบบเข้ามาตั้งตำแหน่งได้ หัวหน้าวิชาการเข้ามาดูได้อย่างเดียว
 * ฝั่งเซิร์ฟเวอร์ปฏิเสธ PATCH ของหัวหน้าวิชาการอยู่แล้ว ที่นี่แค่ไม่แสดงปุ่มให้สับสน
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const role = await getViewerRole();
  const canView: string[] = [USER_ROLE.ADMIN, USER_ROLE.ACADEMIC_HEAD];
  if (!canView.includes(role)) redirect('/forbidden');
  const canEdit = role === USER_ROLE.ADMIN;
  const rawQuery = (await searchParams).q;
  const initialQuery = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim().slice(0, 120) ?? '';

  let users: BackendUser[] = [];
  try {
    users = await backendFetch<BackendUser[]>('/users');
  } catch {
    users = [];
  }

  const pendingUsers = users.filter((user) => user.accountStatus === 'PENDING');
  const pending = pendingUsers.length;
  const assigned = users.filter(
    (user) => user.accountStatus === 'ACTIVE' && user.role !== USER_ROLE.TEACHER,
  ).length;

  return (
    <AppShell role={role} initialSearchQuery={initialQuery}>
      <PageHeading
        eyebrow="Members"
        title="สมาชิกและตำแหน่ง"
        description={
          canEdit
            ? 'รายชื่อผู้สมัครและบุคลากรทั้งหมด พร้อมแต่งตั้งตำแหน่งและกลุ่มสาระ'
            : 'รายชื่อบุคลากรทั้งหมดและตำแหน่งของแต่ละคน (ดูอย่างเดียว)'
        }
      />
      {pending > 0 && (
        <div
          role="status"
          className="mb-5 flex gap-3 rounded-2xl border border-status-pending/35 bg-status-pending/10 p-4"
        >
          <Icon name="bell" className="mt-0.5 size-5 shrink-0 text-status-pending" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              มีผู้สมัครใหม่ {pending} คน รอแต่งตั้งตำแหน่ง
            </p>
            <p className="mt-1 text-xs leading-6 text-ink-muted">
              {pendingUsers
                .slice(0, 3)
                .map((user) => user.name)
                .join(' · ')}
              {pending > 3 ? ` และอีก ${pending - 3} คน` : ''}
              {canEdit
                ? ' — เลือกตำแหน่งให้ในตารางด้านล่างแล้วกดบันทึกเพื่อเปิดใช้งานบัญชี'
                : ' — รอผู้ดูแลระบบแต่งตั้งตำแหน่ง'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="บุคลากรทั้งหมด"
          value={String(users.length)}
          detail="บัญชีในระบบ"
          icon="users"
        />
        <Metric
          label="รอแต่งตั้ง"
          value={String(pending)}
          detail="ผู้สมัครที่ยังเข้าใช้งานไม่ได้"
          icon="inbox"
        />
        <Metric
          label="ได้รับตำแหน่งแล้ว"
          value={String(assigned)}
          detail="นอกเหนือจากอาจารย์ทั่วไป"
          icon="shield"
        />
      </div>
      <SectionCard className="mt-6" title="รายชื่อบุคลากร">
        <RoleAssignmentPanel initialUsers={users} canEdit={canEdit} initialQuery={initialQuery} />
      </SectionCard>
    </AppShell>
  );
}
