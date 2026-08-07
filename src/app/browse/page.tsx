// src/app/browse/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { Icon } from '@/components/ui/icons';
import { MediaCard } from '@/components/library/media-card';
import { PageHeading } from '@/components/ui/page-heading';
import { DEMO_MEDIA } from '@/constants/mock-data';
import { getViewerRole } from '@/lib/auth';

export default async function BrowsePage() {
  const role = await getViewerRole();
  const approved = DEMO_MEDIA.filter(item => item.status === 'APPROVED');
  return <AppShell role={role}>
    <PageHeading eyebrow="Media Library" title="ค้นหาสื่อการสอน" description="ค้นหาสื่อที่ผ่านการตรวจอนุมัติแล้ว พร้อมกรองตามวิชา ระดับชั้น และประเภทสื่อ" />
    <section className="rounded-2xl border border-line/80 bg-panel p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1"><Icon name="search" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"/><input placeholder="ค้นหาชื่อสื่อ เนื้อหา ผู้สอน หรือแท็ก..." className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-brand/40 focus:ring-4 focus:ring-brand/5"/></div>
        <div className="grid grid-cols-2 gap-2 sm:flex"><button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm text-ink-muted"><Icon name="filter" className="size-4"/>วิชา</button><button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm text-ink-muted"><Icon name="layers" className="size-4"/>ระดับชั้น</button><button className="hidden h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm text-ink-muted sm:flex"><Icon name="file" className="size-4"/>ประเภทสื่อ</button></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4"><p className="text-xs text-ink-faint">พบ <strong className="text-ink">{approved.length}</strong> รายการที่พร้อมใช้งานในตัวอย่าง</p><div className="flex rounded-lg border border-line bg-surface p-1"><button className="grid size-8 place-items-center rounded-md bg-brand/10 text-brand"><Icon name="grid" className="size-4"/></button><button className="grid size-8 place-items-center rounded-md text-ink-faint"><Icon name="list" className="size-4"/></button></div></div>
    </section>
    <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{approved.map(media => <MediaCard key={media.id} media={media}/>)}</section>
  </AppShell>;
}
