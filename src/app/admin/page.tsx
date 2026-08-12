import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { RoleAssignmentPanel } from '@/components/admin/role-assignment-panel';
import { USER_ROLE } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { getViewerRole } from '@/lib/auth';
import type { UserSearchPage } from '@/types/backend';

/**
 * หน้าสมาชิกและตำแหน่ง
 *
 * ผู้ดูแลระบบเข้ามาตั้งตำแหน่งได้ หัวหน้าวิชาการเข้ามาดูได้อย่างเดียว
 * ฝั่งเซิร์ฟเวอร์ปฏิเสธ PATCH ของหัวหน้าวิชาการอยู่แล้ว ที่นี่แค่ไม่แสดงปุ่มให้สับสน
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const role = await getViewerRole();
  const canView: string[] = [USER_ROLE.ADMIN, USER_ROLE.ACADEMIC_HEAD];
  if (!canView.includes(role)) redirect('/forbidden');
  const canEdit = role === USER_ROLE.ADMIN;
  const params = await searchParams;
  const rawQuery = params.q;
  const initialQuery = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim().slice(0, 120) ?? '';
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number(rawPage ?? 1);
  const requestedPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  let data: UserSearchPage = {
    items: [],
    total: 0,
    page: requestedPage,
    pageSize: 25,
    totalPages: 1,
    summary: {
      total: 0,
      pending: 0,
      assigned: 0,
      active: 0,
      unverified: 0,
      pendingUsers: [],
      activeByRole: { TEACHER: 0, REVIEWER: 0, ACADEMIC_HEAD: 0, ADMIN: 0 },
    },
  };
  try {
    const query = new URLSearchParams({ page: String(requestedPage), pageSize: '25' });
    if (initialQuery) query.set('q', initialQuery);
    data = await backendFetch<UserSearchPage>(`/users/search?${query}`);
  } catch {
    // แสดงหน้าว่างพร้อมโครง UI เดิมเมื่อ backend ไม่พร้อม
  }

  const users = data.items;
  const pending = data.summary.pending;
  const assigned = data.summary.assigned;

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
              {data.summary.pendingUsers.slice(0, 3).map((user) => user.name).join(' · ')}
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
          value={String(data.summary.total)}
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
        <RoleAssignmentPanel
          key={`${initialQuery}|${data.page}`}
          initialUsers={users}
          canEdit={canEdit}
          initialQuery={initialQuery}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
        />
      </SectionCard>
    </AppShell>
  );
}
