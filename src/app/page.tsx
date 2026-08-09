// src/app/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { AdminHome } from '@/components/dashboard/admin-home';
import { ReviewerHome } from '@/components/dashboard/reviewer-home';
import { TeacherHome } from '@/components/dashboard/teacher-home';
import { QA_STATS, REVIEW_JOBS, TIMELINE } from '@/constants/enterprise-data';
import { backendFetch, toDemoMedia, toReviewJob } from '@/lib/backend';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerName, getViewerRole, getViewerSubjectGroup } from '@/lib/auth';

/**
 * แดชบอร์ดแยกตามบทบาท เพราะสามตำแหน่งถามคำถามคนละข้อกันสิ้นเชิง
 *
 * แตกตรงนี้ไม่ใช่ตอน render เพื่อให้แต่ละบทบาทได้รับ "ข้อมูลคนละชุด" จริง ๆ
 * ถ้าดึงมาก้อนเดียวแล้วค่อยเลือกแสดง ข้อมูลของทุกคนจะติดไปกับ HTML ทั้งหมด (กฎเหล็กข้อ 2)
 *
 */
export default async function HomePage() {
  const role = await getViewerRole();

  if (role === USER_ROLE.TEACHER) {
    const viewer = await getViewerName();
    let mine: ReturnType<typeof toDemoMedia>[] = [];
    try { mine = (await backendFetch<any[]>('/media/mine')).map(toDemoMedia); } catch { mine = []; }
    return (
      <AppShell role={role}>
        <TeacherHome name={viewer} media={mine} />
      </AppShell>
    );
  }

  if (role === USER_ROLE.REVIEWER) {
    const subjectGroup = await getViewerSubjectGroup();
    let subjectJobs: ReturnType<typeof toReviewJob>[] = [];
    try { subjectJobs = (await backendFetch<any[]>('/media/queue')).map(toReviewJob); } catch { subjectJobs = []; }
    return (
      <AppShell role={role}>
        <ReviewerHome subjectGroup={subjectGroup} jobs={subjectJobs} />
      </AppShell>
    );
  }

  return (
    <AppShell role={role}>
      <AdminHome metrics={QA_STATS} jobs={REVIEW_JOBS} timeline={TIMELINE} />
    </AppShell>
  );
}
