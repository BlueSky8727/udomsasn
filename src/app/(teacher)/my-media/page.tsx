import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, Pill, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { DEMO_MEDIA, type DemoFeedback } from '@/constants/mock-data';
import { MEDIA_STATUS, STATUS_LABELS } from '@/constants/workflow';
import { getViewerName, getViewerRole } from '@/lib/auth';

const FEEDBACK_LABEL: Record<DemoFeedback['decision'], string> = {
  REVISION: 'ให้แก้ไข',
  MINOR_REVISION: 'แก้ไขเล็กน้อย',
  REJECTED: 'ไม่ผ่าน',
  APPROVED: 'ผ่านแล้ว',
};

const feedbackTone = (decision: DemoFeedback['decision']) =>
  decision === 'APPROVED'
    ? ('ok' as const)
    : decision === 'REJECTED'
      ? ('danger' as const)
      : ('warn' as const);

export default async function MyMedia() {
  const [role, viewer] = await Promise.all([getViewerRole(), getViewerName()]);

  // คัดเฉพาะของเจ้าของตั้งแต่ฝั่งเซิร์ฟเวอร์ ห้ามส่งข้อมูลของคนอื่นไปซ่อนในเบราว์เซอร์
  const mine = DEMO_MEDIA.filter((media) => media.author === viewer);
  const drafts = mine.filter((media) => media.status === MEDIA_STATUS.DRAFT);
  const submitted = mine.filter((media) => media.status !== MEDIA_STATUS.DRAFT);
  const underReview = mine.filter(
    (media) =>
      media.status === MEDIA_STATUS.PENDING ||
      media.status === MEDIA_STATUS.IN_REVIEW ||
      media.status === MEDIA_STATUS.ACADEMIC_REVIEW,
  );
  const returned = mine.filter(
    (media) =>
      media.status === MEDIA_STATUS.REVISION ||
      media.status === MEDIA_STATUS.ACADEMIC_REVISION ||
      media.status === MEDIA_STATUS.REJECTED,
  );
  const approved = mine.filter((media) => media.status === MEDIA_STATUS.APPROVED);

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Teacher Workspace"
        title="ฉบับร่างและสื่อของฉัน"
        description="เก็บฉบับร่างก่อนส่ง ติดตามว่างานอยู่ที่ใคร และอ่านผลที่หัวหน้ากลุ่มสาระหรือหัวหน้าวิชาการส่งกลับมา"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="ฉบับร่าง" value={String(drafts.length)} detail="ยังไม่ส่งให้กลุ่มสาระ" icon="edit" />
        <Metric label="อยู่ระหว่างตรวจ" value={String(underReview.length)} detail="กำลังเดินตามเส้นทางอนุมัติ" icon="clock" />
        <Metric label="ส่งกลับจากกลุ่มสาระ" value={String(returned.length)} detail="ให้แก้ไขหรือแจ้งว่าไม่ผ่าน" icon="message" />
        <Metric label="ผ่านแล้ว" value={String(approved.length)} detail="หัวหน้าวิชาการอนุมัติขั้นสุดท้าย" icon="check" />
      </div>

      <SectionCard
        className="mt-6"
        title="คลังฉบับร่าง"
        description="บันทึกไว้ทำต่อได้เรื่อย ๆ จนกว่าจะพร้อมส่งให้หัวหน้ากลุ่มสาระ"
      >
        {drafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
            <Icon name="file" className="mx-auto size-7 text-ink-faint" />
            <p className="mt-3 text-sm font-semibold text-ink">ยังไม่มีฉบับร่าง</p>
            <Link
              href="/submit"
              className="mt-4 inline-flex rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-brand-contrast"
            >
              สร้างสื่อใหม่
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {drafts.map((media) => (
              <Link
                key={media.id}
                href={`/my-media/${media.id}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 p-4 transition hover:border-brand/25"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-status-draft/10 text-status-draft">
                  <Icon name="edit" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{media.title}</p>
                    <Pill tone="neutral">ฉบับร่าง</Pill>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    กลุ่มสาระปลายทาง: {media.subjectGroup} · {media.updated}
                  </p>
                </div>
                <Icon name="chevronRight" className="size-4 text-ink-faint" />
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        className="mt-6"
        title="สื่อที่ส่งตรวจแล้ว"
        description="ติดตามสถานะและอ่านข้อความส่งกลับของสื่อแต่ละชิ้น"
      >
        {submitted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center text-xs text-ink-faint">
            ยังไม่มีสื่อที่ส่งตรวจ
          </p>
        ) : (
          <div className="space-y-3">
            {submitted.map((media) => (
              <div
                key={media.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface/70 p-4 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{media.title}</p>
                    <Pill>{STATUS_LABELS[media.status]}</Pill>
                    {media.feedback && (
                      <Pill tone={feedbackTone(media.feedback.decision)}>
                        {FEEDBACK_LABEL[media.feedback.decision]}
                      </Pill>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {media.id} · กลุ่มสาระ{media.subjectGroup} · {media.grade} · {media.updated}
                  </p>
                  {media.feedback && (
                    <p className="mt-2 line-clamp-1 text-xs text-ink-muted">
                      <span className="font-semibold text-brand">จาก {media.feedback.from}:</span>{' '}
                      {media.feedback.message}
                    </p>
                  )}
                </div>
                <Link
                  href={`/my-media/${media.id}`}
                  className="shrink-0 rounded-lg bg-brand/10 px-3 py-2 text-center text-xs font-semibold text-brand"
                >
                  เปิดรายละเอียด
                </Link>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
