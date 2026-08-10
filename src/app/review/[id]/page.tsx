import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { ReviewWorkspace } from '@/components/review/review-workspace';
import { getViewerRole } from '@/lib/auth';
import { backendFetch, toReviewJob } from '@/lib/backend';
import type { BackendMedia } from '@/types/backend';
import { USER_ROLE } from '@/constants/workflow';

async function loadMedia(id: string): Promise<BackendMedia | null> {
  try {
    return await backendFetch<BackendMedia>(`/media/${id}`);
  } catch {
    return null;
  }
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, media] = await Promise.all([getViewerRole(), loadMedia(id)]);
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ACADEMIC_HEAD) redirect('/forbidden');
  if (!media) notFound();
  return (
    <AppShell role={role}>
      <ReviewWorkspace job={toReviewJob(media)} role={role} media={media} />
    </AppShell>
  );
}
