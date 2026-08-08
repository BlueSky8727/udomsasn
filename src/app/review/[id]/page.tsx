import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { ReviewWorkspace } from '@/components/review/review-workspace';
import { REVIEW_JOBS } from '@/constants/enterprise-data';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import { canOpenReviewJob } from '@/lib/review-access';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);
  const job = REVIEW_JOBS.find((item) => item.id === id);

  // ไม่ยืนยันว่ารหัสงานของกลุ่มอื่นมีอยู่จริง
  if (!job || !canOpenReviewJob(job, role, subjectGroup)) notFound();

  return (
    <AppShell role={role}>
      <ReviewWorkspace job={job} role={role} />
    </AppShell>
  );
}
