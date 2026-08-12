import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { MediaActions } from '@/components/media/media-actions';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { PageHeading } from '@/components/ui/page-heading';
import {
  REVIEW_DECISION_LABELS,
  REVIEW_DECISION_TONES,
  REVIEW_TOPICS,
} from '@/constants/review-topics';
import { ROLE_LABELS, STATUS_LABELS, USER_ROLE } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { requireViewer } from '@/lib/auth';
import type { BackendFile, BackendMedia, BackendReview } from '@/types/backend';

async function load(id: string) {
  try {
    return await backendFetch<BackendMedia>(`/media/${id}`);
  } catch {
    return null;
  }
}

/**
 * รวมของที่ผูกกับเวอร์ชันเข้าเป็นรอบ ๆ เรียงจากรอบล่าสุดลงไป
 *
 * กฎเหล็กข้อ 4 ให้คอมเมนต์ผูกกับเวอร์ชันเพื่อย้อนดูได้ว่ารอบไหนถูกติอะไร
 * หน้านี้จึงต้องแสดงทุกรอบ ไม่ใช่เฉพาะรอบล่าสุด
 */
function groupByVersion(files: BackendFile[], reviews: BackendReview[]) {
  const versions = new Set<number>([...files.map((f) => f.version), ...reviews.map((r) => r.mediaVersion)]);
  return [...versions]
    .sort((a, b) => b - a)
    .map((version) => ({
      version,
      files: files.filter((file) => file.version === version),
      reviews: reviews.filter((review) => review.mediaVersion === version),
    }));
}

const fileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default async function MyMediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [viewer, media] = await Promise.all([requireViewer(), load(id)]);
  if (viewer.role !== USER_ROLE.TEACHER || !media || media.ownerId !== viewer.id) notFound();

  const rounds = groupByVersion(media.files, media.reviews);

  return (
    <AppShell role={viewer.role}>
      <Link href="/my-media" className="text-xs font-semibold text-brand">
        ← กลับสื่อของฉัน
      </Link>
      <PageHeading
        eyebrow={`${media.code} · เวอร์ชัน ${media.version}`}
        title={media.title}
        description={`${media.subjectGroup} · ${media.gradeLevel}`}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Pill>{STATUS_LABELS[media.status]}</Pill>
        <MediaActions id={media.id} status={media.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="ข้อมูลสื่อ">
          <p className="whitespace-pre-wrap text-sm leading-7 text-ink-muted">{media.description}</p>
          {media.learningProcess && (
            <>
              <h3 className="mt-5 text-sm font-bold">กระบวนการเรียนรู้</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-muted">
                {media.learningProcess}
              </p>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="ไฟล์แนบ"
          description="ไฟล์ของทุกรอบยังอยู่ครบ ไฟล์ที่ส่งใหม่ไม่ทับของเดิม"
        >
          <div className="space-y-4">
            {rounds
              .filter((round) => round.files.length > 0)
              .map((round) => (
                <div key={round.version}>
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    รอบที่ {round.version}
                    {round.version === media.version && <Pill tone="ok">ฉบับปัจจุบัน</Pill>}
                  </p>
                  <div className="space-y-2">
                    {round.files.map((file) => (
                      <a
                        key={file.id}
                        target="_blank"
                        rel="noreferrer"
                        href={`/api/backend/media/${media.id}/files/${file.id}/download`}
                        className="block rounded-lg border border-line p-3 text-xs font-semibold text-brand transition-colors hover:border-brand/40"
                      >
                        {file.name}
                        <span className="mt-1 block font-normal text-ink-faint">{fileSize(file.size)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            {media.files.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-faint">ยังไม่มีไฟล์แนบ</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        className="mt-6"
        title="ผลตรวจแยกตามรอบที่ส่ง"
        description="ย้อนดูได้ว่ารอบไหนถูกติเรื่องอะไร และแก้ไปแล้วผลเปลี่ยนอย่างไร"
      >
        {media.reviews.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">ยังไม่มีผลตรวจ</p>
        ) : (
          <div className="space-y-5">
            {rounds
              .filter((round) => round.reviews.length > 0)
              .map((round) => (
                <div key={round.version} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2 border-b border-line/70 pb-3">
                    <p className="text-sm font-bold">รอบที่ {round.version}</p>
                    {round.version === media.version && <Pill tone="ok">ฉบับปัจจุบัน</Pill>}
                  </div>

                  <div className="mt-3 space-y-4">
                    {round.reviews.map((review) => (
                      <div key={review.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {review.reviewer.name}
                            <span className="ml-1.5 font-normal text-ink-faint">
                              · {ROLE_LABELS[review.reviewer.role]}
                            </span>
                          </p>
                          {review.decision ? (
                            <Pill tone={REVIEW_DECISION_TONES[review.decision]}>
                              {REVIEW_DECISION_LABELS[review.decision]}
                            </Pill>
                          ) : (
                            <Pill tone="neutral">กำลังตรวจ</Pill>
                          )}
                        </div>
                        {review.summary && (
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-ink-muted">
                            {review.summary}
                          </p>
                        )}
                        <div className="mt-3 space-y-2">
                          {REVIEW_TOPICS.map((topic) => {
                            const item = review.items.find((entry) => entry.topicId === topic.id);
                            if (!item?.result && !item?.comment) return null;
                            return (
                              <div key={topic.id} className="rounded-lg border border-line bg-panel p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold">{topic.title}</p>
                                  <Pill tone={item.result === 'PASS' ? 'ok' : 'warn'}>
                                    {item.result === 'PASS' ? 'เรียบร้อย' : 'ควรแก้'}
                                  </Pill>
                                </div>
                                {item.comment && (
                                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-ink-muted">
                                    {item.comment}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      <SectionCard className="mt-6" title="ประวัติสถานะ">
        <div className="space-y-3">
          {media.statusLogs.map((log) => (
            <div key={log.id} className="rounded-lg border-l-2 border-brand bg-surface px-4 py-3">
              <p className="text-xs font-semibold">
                {STATUS_LABELS[log.fromStatus]} → {STATUS_LABELS[log.toStatus]}
              </p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {log.actor?.name ?? 'ระบบ'} · {new Date(log.createdAt).toLocaleString('th-TH')}
              </p>
              {log.reason && <p className="mt-2 text-xs text-ink-muted">{log.reason}</p>}
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
