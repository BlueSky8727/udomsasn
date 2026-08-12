import { AppShell } from '@/components/ui/app-shell';
import { MediaBrowser } from '@/components/library/media-browser';
import { PageHeading } from '@/components/ui/page-heading';
import { getViewerRole } from '@/lib/auth';
import { backendFetch, toDemoMedia } from '@/lib/backend';
import type { BackendMedia } from '@/types/backend';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const role = await getViewerRole();
  const rawQuery = (await searchParams).q;
  const initialQuery = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim().slice(0, 120) ?? '';
  let approved: ReturnType<typeof toDemoMedia>[] = [];
  try {
    approved = (await backendFetch<BackendMedia[]>('/media/public')).map(toDemoMedia);
  } catch {
    approved = [];
  }
  return (
    <AppShell role={role} initialSearchQuery={initialQuery}>
      <PageHeading
        eyebrow="Media Library"
        title="ค้นหาสื่อการสอน"
        description="ค้นหาสื่อที่ผ่านการตรวจอนุมัติแล้ว พร้อมกรองตามวิชาและระดับชั้น"
      />
      <MediaBrowser media={approved} initialQuery={initialQuery} />
    </AppShell>
  );
}
