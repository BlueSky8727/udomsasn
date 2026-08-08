import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { ReviewWorkspace } from '@/components/review/review-workspace';
import { REVIEW_JOBS } from '@/constants/enterprise-data';
import { MEDIA_STATUS, USER_ROLE } from '@/constants/workflow';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);
  const job = REVIEW_JOBS.find((item) => item.id === id);

  const canOpen =
    job &&
    ((role === USER_ROLE.REVIEWER &&
      job.department === subjectGroup &&
      (job.status === MEDIA_STATUS.PENDING || job.status === MEDIA_STATUS.IN_REVIEW)) ||
      (role === USER_ROLE.ADMIN && job.status === MEDIA_STATUS.ACADEMIC_REVIEW));

  // ไม่ยืนยันว่ารหัสงานของกลุ่มอื่นมีอยู่จริง
  if (!job || !canOpen) notFound();

  return (
    <AppShell role={role}>
      <ReviewWorkspace job={job} role={role} />
    </AppShell>
  );
}
