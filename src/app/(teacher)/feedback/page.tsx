import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { PageHeading } from '@/components/ui/page-heading';
import { MEDIA_STATUS, USER_ROLE, type MediaStatus } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { getViewerRole } from '@/lib/auth';
import type { BackendMedia } from '@/types/backend';

export default async function FeedbackPage() {
  const role = await getViewerRole();
  if (role !== USER_ROLE.TEACHER) redirect('/forbidden');
  let media: BackendMedia[] = [];
  try { media = await backendFetch<BackendMedia[]>('/media/mine'); } catch { media = []; }
  const actionable = new Set<MediaStatus>([MEDIA_STATUS.REVISION, MEDIA_STATUS.ACADEMIC_REVISION, MEDIA_STATUS.REJECTED]);
  const items = media.filter((item) => actionable.has(item.status));
  return <AppShell role={role}><PageHeading eyebrow="Teacher Feedback" title="ผลตรวจที่ต้องดำเนินการ" description="ข้อเสนอแนะจริงจากผู้ตรวจ แยกตามสื่อและเวอร์ชัน"/><SectionCard title={`${items.length} รายการ`}>{items.length === 0 ? <p className="py-10 text-center text-sm text-ink-faint">ยังไม่มีผลตรวจที่ต้องดำเนินการ</p> : <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => { const review = item.reviews.find((entry) => entry.decision && entry.decision !== 'FORWARD'); return <Link key={item.id} href={`/my-media/${item.id}`} className="rounded-xl border border-line bg-surface p-4"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{item.title}</p><Pill tone={item.status === MEDIA_STATUS.REJECTED ? 'danger' : 'warn'}>{item.status === MEDIA_STATUS.REJECTED ? 'ไม่ผ่าน' : 'ต้องแก้ไข'}</Pill></div><p className="mt-3 line-clamp-2 text-xs leading-6 text-ink-muted">{review?.summary ?? 'เปิดรายละเอียดเพื่ออ่านผลตรวจรายหัวข้อ'}</p></Link>; })}</div>}</SectionCard></AppShell>;
}
