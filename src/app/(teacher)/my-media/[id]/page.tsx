import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { MediaActions } from '@/components/media/media-actions';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { PageHeading } from '@/components/ui/page-heading';
import { REVIEW_TOPICS } from '@/constants/review-topics';
import { STATUS_LABELS, USER_ROLE } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { requireViewer } from '@/lib/auth';
import type { BackendMedia } from '@/types/backend';

async function load(id: string) { try { return await backendFetch<BackendMedia>(`/media/${id}`); } catch { return null; } }

export default async function MyMediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [viewer, media] = await Promise.all([requireViewer(), load(id)]);
  if (viewer.role !== USER_ROLE.TEACHER || !media || media.ownerId !== viewer.id) notFound();
  const review = media.reviews.find((item) => item.decision && item.decision !== 'FORWARD');
  return (
    <AppShell role={viewer.role}>
      <Link href="/my-media" className="text-xs font-semibold text-brand">← กลับสื่อของฉัน</Link>
      <PageHeading eyebrow={`${media.code} · เวอร์ชัน ${media.version}`} title={media.title} description={`${media.subjectGroup} · ${media.gradeLevel}`} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Pill>{STATUS_LABELS[media.status]}</Pill><MediaActions id={media.id} status={media.status} /></div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="ข้อมูลสื่อ"><p className="whitespace-pre-wrap text-sm leading-7 text-ink-muted">{media.description}</p>{media.learningProcess && <><h3 className="mt-5 text-sm font-bold">กระบวนการเรียนรู้</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-muted">{media.learningProcess}</p></>}</SectionCard>
        <SectionCard title="ไฟล์แนบ"><div className="space-y-2">{media.files.map((file) => <a key={file.id} target="_blank" rel="noreferrer" href={`/api/backend/media/${media.id}/files/${file.id}/download`} className="block rounded-lg border border-line p-3 text-xs font-semibold text-brand">{file.name}</a>)}</div></SectionCard>
      </div>
      {review && <SectionCard className="mt-6" title={`ผลตรวจจาก ${review.reviewer.name}`} description={review.summary ?? undefined}><div className="space-y-3">{REVIEW_TOPICS.map((topic) => { const item = review.items.find((entry) => entry.topicId === topic.id); return <div key={topic.id} className="rounded-xl border border-line bg-surface p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">{topic.title}</p><Pill tone={item?.result === 'PASS' ? 'ok' : 'warn'}>{item?.result === 'PASS' ? 'เรียบร้อย' : 'ควรแก้'}</Pill></div>{item?.comment && <p className="mt-2 text-xs leading-6 text-ink-muted">{item.comment}</p>}</div>; })}</div></SectionCard>}
      <SectionCard className="mt-6" title="ประวัติสถานะ"><div className="space-y-3">{media.statusLogs.map((log) => <div key={log.id} className="rounded-lg border-l-2 border-brand bg-surface px-4 py-3"><p className="text-xs font-semibold">{STATUS_LABELS[log.fromStatus]} → {STATUS_LABELS[log.toStatus]}</p><p className="mt-1 text-[11px] text-ink-faint">{log.actor?.name ?? 'ระบบ'} · {new Date(log.createdAt).toLocaleString('th-TH')}</p>{log.reason && <p className="mt-2 text-xs text-ink-muted">{log.reason}</p>}</div>)}</div></SectionCard>
    </AppShell>
  );
}
