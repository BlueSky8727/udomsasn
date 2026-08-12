import { AppShell } from '@/components/ui/app-shell';
import { MediaBrowser } from '@/components/library/media-browser';
import { PageHeading } from '@/components/ui/page-heading';
import { getViewerRole } from '@/lib/auth';
import { backendFetch, toMediaListItem } from '@/lib/backend';
import type { PublicMediaPage } from '@/types/backend';

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
const list = (value?: string | string[]) => (Array.isArray(value) ? value : value?.split(',') ?? [])
  .map((item) => item.trim())
  .filter(Boolean)
  .slice(0, 20);

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; subject?: string | string[]; grade?: string | string[]; page?: string | string[] }>;
}) {
  const role = await getViewerRole();
  const params = await searchParams;
  const initialQuery = first(params.q)?.trim().slice(0, 120) ?? '';
  const subjects = list(params.subject);
  const grades = list(params.grade);
  const requestedPage = Number(first(params.page) ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let approved: ReturnType<typeof toMediaListItem>[] = [];
  let total = 0;
  let totalPages = 1;
  let facets = { subjects: [] as string[], grades: [] as string[] };
  try {
    const query = new URLSearchParams({ page: String(page), pageSize: '24' });
    if (initialQuery) query.set('q', initialQuery);
    if (subjects.length) query.set('subject', subjects.join(','));
    if (grades.length) query.set('grade', grades.join(','));
    const result = await backendFetch<PublicMediaPage>(`/media/public?${query}`);
    approved = result.items.map(toMediaListItem);
    total = result.total;
    totalPages = result.totalPages;
    facets = result.facets;
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
      <MediaBrowser
        key={`${initialQuery}|${subjects.join(',')}|${grades.join(',')}|${page}`}
        media={approved}
        initialQuery={initialQuery}
        initialSelection={{ subject: subjects, grade: grades }}
        facetOptions={{ subject: facets.subjects, grade: facets.grades }}
        total={total}
        page={page}
        totalPages={totalPages}
      />
    </AppShell>
  );
}
