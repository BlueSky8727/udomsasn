// src/app/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { AdminHome } from '@/components/dashboard/admin-home';
import { ReviewerHome } from '@/components/dashboard/reviewer-home';
import { SystemAdminHome } from '@/components/dashboard/system-admin-home';
import { TeacherHome } from '@/components/dashboard/teacher-home';
import { backendFetch, toDemoMedia, toReviewJob } from '@/lib/backend';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerName, getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import type { AnalyticsSummary, BackendMedia, BackendUser } from '@/types/backend';

/**
 * แดชบอร์ดแยกตามตำแหน่ง เพราะสามตำแหน่งถามคำถามคนละข้อกันสิ้นเชิง
 *
 * แตกตรงนี้ไม่ใช่ตอน render เพื่อให้แต่ละตำแหน่งได้รับ "ข้อมูลคนละชุด" จริง ๆ
 * ถ้าดึงมาก้อนเดียวแล้วค่อยเลือกแสดง ข้อมูลของทุกคนจะติดไปกับ HTML ทั้งหมด (กฎเหล็กข้อ 2)
 *
 */
export default async function HomePage() {
  const role = await getViewerRole();

  if (role === USER_ROLE.TEACHER) {
    const viewer = await getViewerName();
    let mine: ReturnType<typeof toDemoMedia>[] = [];
    try { mine = (await backendFetch<BackendMedia[]>('/media/mine')).map(toDemoMedia); } catch { mine = []; }
    return (
      <AppShell role={role}>
        <TeacherHome name={viewer} media={mine} />
      </AppShell>
    );
  }

  if (role === USER_ROLE.REVIEWER) {
    const subjectGroup = await getViewerSubjectGroup();
    let subjectJobs: ReturnType<typeof toReviewJob>[] = [];
    try { subjectJobs = (await backendFetch<BackendMedia[]>('/media/queue')).map(toReviewJob); } catch { subjectJobs = []; }
    return (
      <AppShell role={role}>
        <ReviewerHome subjectGroup={subjectGroup} jobs={subjectJobs} />
      </AppShell>
    );
  }

  // ผู้ดูแลระบบไม่มีสิทธิ์อ่านคิวตรวจและรายงาน จึงต้องแยกออกมาก่อน
  // ถ้าปล่อยให้ลงไปเส้นเดียวกับหัวหน้าวิชาการ คำขอจะโดน 403 แล้วแดชบอร์ดจะว่างทั้งหน้า
  if (role === USER_ROLE.ADMIN) {
    const viewer = await getViewerName();
    let accounts: BackendUser[] = [];
    try { accounts = await backendFetch<BackendUser[]>('/users'); } catch { accounts = []; }
    return (
      <AppShell role={role}>
        <SystemAdminHome name={viewer} users={accounts} />
      </AppShell>
    );
  }

  let jobs: ReturnType<typeof toReviewJob>[] = [];
  let summary: AnalyticsSummary | null = null;
  let users: BackendUser[] = [];
  try {
    [jobs, summary, users] = await Promise.all([
      backendFetch<BackendMedia[]>('/media/queue').then((items) => items.map(toReviewJob)),
      backendFetch<AnalyticsSummary>('/analytics/summary'),
      backendFetch<BackendUser[]>('/users'),
    ]);
  } catch {
    jobs = [];
  }
  const metrics = [
    { label: 'สื่อทั้งหมด', value: String(summary?.all ?? 0), detail: `${summary?.approved ?? 0} รายการเผยแพร่แล้ว` },
    { label: 'รอตรวจ', value: String(summary?.pending ?? 0), detail: 'ทุกขั้นตอน' },
    { label: 'อัตราผ่าน', value: `${summary?.approvalRate ?? 0}%`, detail: 'คำนวณจากฐานข้อมูล' },
    { label: 'นำกลับไปใช้', value: String(summary?.downloads ?? 0), detail: 'จำนวนดาวน์โหลดสะสม' },
  ];
  return (
    <AppShell role={role}>
      <AdminHome metrics={metrics} jobs={jobs} timeline={[]} pendingUsers={users.filter((user) => user.accountStatus === 'PENDING').length} />
    </AppShell>
  );
}
