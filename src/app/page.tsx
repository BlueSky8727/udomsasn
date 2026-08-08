// src/app/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { AdminHome } from '@/components/dashboard/admin-home';
import { ReviewerHome } from '@/components/dashboard/reviewer-home';
import { TeacherHome } from '@/components/dashboard/teacher-home';
import { QA_STATS, REVIEW_JOBS, TIMELINE } from '@/constants/enterprise-data';
import { DEMO_MEDIA } from '@/constants/mock-data';
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
    const mine = DEMO_MEDIA.filter((item) => item.author === viewer);
    return (
      <AppShell role={role}>
        <TeacherHome name={viewer} media={mine} />
      </AppShell>
    );
  }

  if (role === USER_ROLE.REVIEWER) {
    const subjectGroup = await getViewerSubjectGroup();
    const subjectJobs = subjectGroup
      ? REVIEW_JOBS.filter(
          (job) =>
            job.department === subjectGroup &&
            (job.status === 'PENDING' || job.status === 'IN_REVIEW'),
        )
      : [];
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
