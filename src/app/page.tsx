// src/app/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { AdminHome } from '@/components/dashboard/admin-home';
import { ReviewerHome } from '@/components/dashboard/reviewer-home';
import { SystemAdminHome } from '@/components/dashboard/system-admin-home';
import { TeacherHome } from '@/components/dashboard/teacher-home';
import { backendFetch, toMediaListItem, toReviewJob } from '@/lib/backend';
import { STATUS_LABELS, USER_ROLE } from '@/constants/workflow';
import { getViewerName, getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import type { AnalyticsSummary, BackendMedia, UserSearchPage } from '@/types/backend';

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
    let mine: ReturnType<typeof toMediaListItem>[] = [];
    try { mine = (await backendFetch<BackendMedia[]>('/media/mine')).map(toMediaListItem); } catch { mine = []; }
    return (
      <AppShell role={role} viewerName={viewer}>
        <TeacherHome name={viewer} media={mine} />
      </AppShell>
    );
  }

  if (role === USER_ROLE.REVIEWER) {
    const [subjectGroup, viewer] = await Promise.all([getViewerSubjectGroup(), getViewerName()]);
    let subjectJobs: ReturnType<typeof toReviewJob>[] = [];
    try { subjectJobs = (await backendFetch<BackendMedia[]>('/media/queue')).map(toReviewJob); } catch { subjectJobs = []; }
    return (
      <AppShell role={role} viewerName={viewer}>
        <ReviewerHome subjectGroup={subjectGroup} jobs={subjectJobs} />
      </AppShell>
    );
  }

  // ผู้ดูแลระบบไม่มีสิทธิ์อ่านคิวตรวจและรายงาน จึงต้องแยกออกมาก่อน
  // ถ้าปล่อยให้ลงไปเส้นเดียวกับหัวหน้าวิชาการ คำขอจะโดน 403 แล้วแดชบอร์ดจะว่างทั้งหน้า
  if (role === USER_ROLE.ADMIN) {
    const viewer = await getViewerName();
    let accountPage: UserSearchPage | null = null;
    try { accountPage = await backendFetch<UserSearchPage>('/users/search?page=1&pageSize=1'); } catch { accountPage = null; }
    return (
      <AppShell role={role} viewerName={viewer}>
        <SystemAdminHome name={viewer} summary={accountPage?.summary} />
      </AppShell>
    );
  }

  let jobs: ReturnType<typeof toReviewJob>[] = [];
  let summary: AnalyticsSummary | null = null;
  let userPage: UserSearchPage | null = null;
  try {
    [jobs, summary, userPage] = await Promise.all([
      backendFetch<BackendMedia[]>('/media/queue').then((items) => items.map(toReviewJob)),
      backendFetch<AnalyticsSummary>('/analytics/summary'),
      backendFetch<UserSearchPage>('/users/search?page=1&pageSize=1'),
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
  const timeline = (summary?.timeline ?? []).map((event) => ({
    time: new Date(event.createdAt).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    title: `${event.actorName} เปลี่ยนสถานะสื่อ`,
    detail: `${event.mediaCode} · ${event.mediaTitle} · ${STATUS_LABELS[event.fromStatus]} → ${STATUS_LABELS[event.toStatus]}${event.reason ? ` · ${event.reason}` : ''}`,
  }));
  const viewer = await getViewerName();
  return (
    <AppShell role={role} viewerName={viewer}>
      <AdminHome metrics={metrics} jobs={jobs} timeline={timeline} pendingUsers={userPage?.summary.pending ?? 0} />
    </AppShell>
  );
}
