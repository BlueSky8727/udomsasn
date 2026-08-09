// src/app/(admin)/queue/page.tsx
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { QueueTable } from '@/components/review/queue-table';
import { REVIEW_JOBS } from '@/constants/enterprise-data';
import { MEDIA_STATUS, USER_ROLE } from '@/constants/workflow';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
export default async function QueuePage() {
  const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ADMIN) notFound();

  const jobs =
    role === USER_ROLE.ADMIN
      ? REVIEW_JOBS.filter(
          (job) =>
            job.status === MEDIA_STATUS.ACADEMIC_REVIEW ||
            job.status === MEDIA_STATUS.ACADEMIC_REVISION,
        )
      : REVIEW_JOBS.filter(
          (job) =>
            job.department === subjectGroup &&
            (job.status === MEDIA_STATUS.PENDING ||
              job.status === MEDIA_STATUS.IN_REVIEW ||
              job.status === MEDIA_STATUS.REVISION),
        );
  const waiting = jobs.filter(
    (job) =>
      job.status === MEDIA_STATUS.PENDING || job.status === MEDIA_STATUS.ACADEMIC_REVIEW,
  );
  const inReview = jobs.filter((job) => job.status === MEDIA_STATUS.IN_REVIEW);

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Review Center"
        title={role === USER_ROLE.ADMIN ? 'คิวตรวจขั้นสุดท้าย' : `คิวกลุ่มสาระ${subjectGroup ?? ''}`}
        description={
          role === USER_ROLE.ADMIN
            ? 'สื่อในหน้านี้ผ่านหัวหน้ากลุ่มสาระและมีคอมเมนต์รายหัวข้อครบแล้ว'
            : 'แสดงเฉพาะสื่อที่อาจารย์เลือกส่งมายังกลุ่มสาระที่คุณได้รับมอบหมาย'
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label={role === USER_ROLE.ADMIN ? 'รอตรวจขั้นสุดท้าย' : 'รอรับเรื่อง'}
          value={String(waiting.length)}
          detail={waiting.length > 0 ? `เก่าสุด ${waiting.at(-1)?.age ?? '-'}` : 'ไม่มีงานค้าง'}
          icon="inbox"
        />
        <Metric
          label="กำลังตรวจ"
          value={String(inReview.length)}
          detail={role === USER_ROLE.ADMIN ? 'ตรวจโดยหัวหน้าวิชาการ' : 'อยู่ในความรับผิดชอบของคุณ'}
          icon="eye"
        />
        <Metric label="SLA วันนี้" value="94%" detail="ภายใน 24 ชั่วโมง" icon="clock" />
      </div>
      <SectionCard
        className="mt-6"
        title={role === USER_ROLE.ADMIN ? 'รายการรออนุมัติ' : 'สื่อที่ส่งเข้ากลุ่มสาระของคุณ'}
        description="ทุกหัวข้อบันทึกผลและคอมเมนต์แยกกัน AI เป็นเพียงข้อมูลประกอบ"
      >
        <QueueTable jobs={jobs} />
      </SectionCard>
    </AppShell>
  );
}
