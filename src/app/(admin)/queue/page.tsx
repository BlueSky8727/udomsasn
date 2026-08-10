import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { QueueTable } from '@/components/review/queue-table';
import { MEDIA_STATUS, USER_ROLE } from '@/constants/workflow';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import { backendFetch, toReviewJob } from '@/lib/backend';
import type { ReviewJob } from '@/constants/enterprise-data';
import type { BackendMedia } from '@/types/backend';

export default async function QueuePage() {
  const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ACADEMIC_HEAD) redirect('/forbidden');
  let jobs: ReviewJob[] = [];
  try {
    jobs = (await backendFetch<BackendMedia[]>('/media/queue')).map(toReviewJob);
  } catch {
    jobs = [];
  }
  const waiting = jobs.filter(
    (job) => job.status === MEDIA_STATUS.PENDING || job.status === MEDIA_STATUS.ACADEMIC_REVIEW,
  );
  const inReview = jobs.filter((job) => job.status === MEDIA_STATUS.IN_REVIEW);
  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Review Center"
        title={role === USER_ROLE.ACADEMIC_HEAD ? 'คิวตรวจขั้นสุดท้าย' : `คิวกลุ่มสาระ${subjectGroup ?? ''}`}
        description="ข้อมูลจาก Prisma Backend · AI เป็นข้อมูลประกอบและมนุษย์เป็นผู้ตัดสิน"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="รอตรวจ" value={String(waiting.length)} detail="ข้อมูลจริงจากฐานข้อมูล" icon="inbox" />
        <Metric label="กำลังตรวจ" value={String(inReview.length)} detail="งานที่รับแล้ว" icon="eye" />
        <Metric label="SLA" value="24 ชม." detail="เป้าหมายเวลาตรวจ" icon="clock" />
      </div>
      <SectionCard className="mt-6" title="รายการตรวจ"><QueueTable jobs={jobs} /></SectionCard>
    </AppShell>
  );
}
