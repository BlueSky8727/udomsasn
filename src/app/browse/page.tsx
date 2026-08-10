import { AppShell } from '@/components/ui/app-shell';
import { MediaBrowser } from '@/components/library/media-browser';
import { PageHeading } from '@/components/ui/page-heading';
import { getViewerRole } from '@/lib/auth';
import { backendFetch, toDemoMedia } from '@/lib/backend';
import type { BackendMedia } from '@/types/backend';

export default async function BrowsePage() {
  const role = await getViewerRole();
  let approved: ReturnType<typeof toDemoMedia>[] = [];
  try {
    approved = (await backendFetch<BackendMedia[]>('/media/public')).map(toDemoMedia);
  } catch {
    approved = [];
  }
  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Media Library"
        title="ค้นหาสื่อการสอน"
        description="ค้นหาสื่อที่ผ่านการตรวจอนุมัติแล้ว พร้อมกรองตามวิชาและระดับชั้น"
      />
      <MediaBrowser media={approved} />
    </AppShell>
  );
}
