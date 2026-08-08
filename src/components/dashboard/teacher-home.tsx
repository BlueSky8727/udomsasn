import Link from 'next/link';
import { Metric, Pill, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import type { DemoFeedback, DemoMedia } from '@/constants/mock-data';
import { MEDIA_STATUS, STATUS_LABELS } from '@/constants/workflow';

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

/**
 * แดชบอร์ดของอาจารย์ — แยกงานเป็นฉบับร่าง เส้นทางตรวจ และผลที่ส่งกลับถึงเจ้าของ
 * ผู้เรียกต้องคัดเฉพาะสื่อของเจ้าของคนนี้มาตั้งแต่ฝั่งเซิร์ฟเวอร์
 */
export function TeacherHome({ name, media }: { name: string; media: readonly DemoMedia[] }) {
  const drafts = media.filter((item) => item.status === MEDIA_STATUS.DRAFT);
  const underReview = media.filter(
    (item) =>
      item.status === MEDIA_STATUS.PENDING ||
      item.status === MEDIA_STATUS.IN_REVIEW ||
      item.status === MEDIA_STATUS.ACADEMIC_REVIEW,
  );
  const subjectFeedback = media.filter(
    (item) => item.feedback?.fromRole === 'SUBJECT_HEAD',
  );
  const academicApprovals = media.filter(
    (item) => item.feedback?.fromRole === 'ACADEMIC_HEAD' && item.feedback.decision === 'APPROVED',
  );
  const feedback = media.filter((item) => item.feedback);
  const needsAction =
    drafts.length +
    media.filter(
      (item) =>
        item.status === MEDIA_STATUS.REVISION || item.status === MEDIA_STATUS.ACADEMIC_REVISION,
    ).length;

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-brand/15 bg-gradient-to-br from-brand/14 via-panel to-panel p-7 shadow-sm sm:p-9">
        <div className="absolute -right-16 -top-20 size-72 rounded-full bg-brand/8 blur-2xl" />
        <div className="relative">
          <Pill>พื้นที่สร้างและส่งสื่อของอาจารย์</Pill>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">
            สวัสดี {name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">
            {needsAction > 0
              ? `มี ${needsAction} รายการที่รอให้คุณทำต่อ ทั้งฉบับร่างและงานที่หัวหน้ากลุ่มสาระส่งกลับมาให้แก้ไข`
              : 'ตอนนี้ไม่มีฉบับร่างหรืองานแก้ไขค้างอยู่ คุณสามารถเริ่มสร้างสื่อชิ้นใหม่ได้เลย'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-strong"
            >
              <Icon name="plus" className="size-4" />
              สร้างสื่อใหม่
            </Link>
            <Link
              href="/my-media"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel/80 px-4 py-2.5 text-sm font-semibold transition hover:border-brand/30"
            >
              <Icon name="folder" className="size-4" />
              ฉบับร่างและสื่อของฉัน
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/my-media?view=drafts#media-list" aria-label="ดูรายการฉบับร่าง" className="group block rounded-2xl">
          <Metric
            label="ฉบับร่าง"
            value={String(drafts.length)}
            detail="เก็บไว้แก้ไขก่อนส่งตรวจ"
            icon="edit"
            className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/35 group-hover:shadow-md"
          />
        </Link>
        <Link href="/my-media?view=reviewing#media-list" aria-label="ดูรายการที่อยู่ระหว่างตรวจ" className="group block rounded-2xl">
          <Metric
            label="อยู่ระหว่างตรวจ"
            value={String(underReview.length)}
            detail="กำลังอยู่ที่กลุ่มสาระหรือฝ่ายวิชาการ"
            icon="clock"
            className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/35 group-hover:shadow-md"
          />
        </Link>
        <Link href="/my-media?view=subject-feedback#media-list" aria-label="ดูรายการผลจากกลุ่มสาระ" className="group block rounded-2xl">
          <Metric
            label="ผลจากกลุ่มสาระ"
            value={String(subjectFeedback.length)}
            detail="รายการให้แก้ไขหรือไม่ผ่าน"
            icon="message"
            className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/35 group-hover:shadow-md"
          />
        </Link>
        <Link href="/my-media?view=academic-approved#media-list" aria-label="ดูรายการที่ผ่านจากฝ่ายวิชาการ" className="group block rounded-2xl">
          <Metric
            label="ผ่านจากฝ่ายวิชาการ"
            value={String(academicApprovals.length)}
            detail="อนุมัติขั้นสุดท้ายและเข้าคลังแล้ว"
            icon="check"
            className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/35 group-hover:shadow-md"
          />
        </Link>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <SectionCard title="ฉบับร่างรอส่งตรวจ" description="สื่อที่บันทึกไว้ยังไม่ถูกส่งให้กลุ่มสาระ">
          {drafts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
              <Icon name="file" className="mx-auto size-6 text-ink-faint" />
              <p className="mt-3 text-sm font-semibold">ไม่มีฉบับร่างค้างอยู่</p>
              <Link href="/submit" className="mt-2 inline-block text-xs font-semibold text-brand">
                สร้างสื่อชิ้นใหม่
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((item) => (
                <Link
                  key={item.id}
                  href={`/my-media/${item.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-4 transition hover:border-brand/25"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-draft/10 text-status-draft">
                    <Icon name="edit" className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      ส่งไปกลุ่มสาระ{item.subjectGroup} · แก้ไขล่าสุด {item.updated}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand">ทำต่อ</span>
                  <Icon name="chevronRight" className="size-4 text-ink-faint" />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="ผลการตรวจส่งกลับ" description="ระบุชัดว่าใครเป็นผู้ส่งผลและต้องดำเนินการอะไรต่อ">
          {feedback.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-8 text-center text-xs text-ink-faint">
              ยังไม่มีผลการตรวจส่งกลับ
            </p>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => {
                const result = item.feedback!;
                return (
                  <Link
                    key={item.id}
                    href={`/my-media/${item.id}`}
                    className="block rounded-xl border border-line bg-surface/60 p-4 transition hover:border-brand/25"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold">{item.title}</p>
                      <Pill tone={feedbackTone(result.decision)}>{FEEDBACK_LABEL[result.decision]}</Pill>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-brand">จาก {result.from}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">{result.message}</p>
                    <p className="mt-2 text-[11px] text-ink-faint">{result.at}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        className="mt-6"
        title="กำลังอยู่ในกระบวนการตรวจ"
        description="ติดตามได้ว่าสื่ออยู่ที่หัวหน้ากลุ่มสาระหรือหัวหน้าวิชาการ"
      >
        {underReview.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-8 text-center text-xs text-ink-faint">
            ไม่มีสื่ออยู่ระหว่างตรวจ
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {underReview.map((item) => (
              <Link
                key={item.id}
                href={`/my-media/${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-4 transition hover:border-brand/25"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-in-review/10 text-status-in-review">
                  <Icon name="clock" className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {item.reviewStage === 'ACADEMIC'
                      ? 'ผ่านกลุ่มสาระแล้ว · รอหัวหน้าวิชาการ'
                      : `อยู่ที่หัวหน้ากลุ่มสาระ${item.subjectGroup}`}
                  </p>
                </div>
                <Pill>{STATUS_LABELS[item.status]}</Pill>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
