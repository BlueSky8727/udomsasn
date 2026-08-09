import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { Icon } from '@/components/ui/icons';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { DEMO_MEDIA, type DemoFeedback } from '@/constants/mock-data';
import { REVIEW_TOPICS } from '@/constants/review-topics';
import {
  MEDIA_STATUS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  USER_ROLE,
} from '@/constants/workflow';
import { getViewerName, getViewerRole } from '@/lib/auth';

type StepState = 'waiting' | 'active' | 'done' | 'stopped';

const STEP_STYLE: Record<StepState, string> = {
  waiting: 'border-line bg-surface text-ink-faint',
  active: 'border-brand/30 bg-brand/8 text-brand',
  done: 'border-status-approved/25 bg-status-approved/8 text-status-approved',
  stopped: 'border-status-rejected/25 bg-status-rejected/8 text-status-rejected',
};

const FEEDBACK_LABEL: Record<DemoFeedback['decision'], string> = {
  REVISION: 'ให้แก้ไข',
  MINOR_REVISION: 'แก้ไขเล็กน้อย',
  REJECTED: 'ไม่ผ่าน',
  APPROVED: 'ผ่านแล้ว',
};

export default async function MyMediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, viewer] = await Promise.all([getViewerRole(), getViewerName()]);

  if (role !== USER_ROLE.TEACHER) notFound();

  const media = DEMO_MEDIA.find((item) => item.id === id);

  // เปิดได้เฉพาะเจ้าของ ถ้าไม่ใช่ให้ตอบ 404 เพื่อไม่เปิดเผยว่ารหัสสื่อนี้มีอยู่จริง
  if (!media || media.author !== viewer) notFound();

  const stoppedAtSubject =
    media.status === MEDIA_STATUS.REVISION || media.status === MEDIA_STATUS.REJECTED;
  const stoppedAtAcademic = media.status === MEDIA_STATUS.ACADEMIC_REVISION;
  const sent = media.status !== MEDIA_STATUS.DRAFT;
  const passedSubject =
    media.reviewStage === 'ACADEMIC' ||
    media.status === MEDIA_STATUS.ACADEMIC_REVIEW ||
    media.status === MEDIA_STATUS.ACADEMIC_REVISION ||
    media.status === MEDIA_STATUS.APPROVED;
  const approved = media.status === MEDIA_STATUS.APPROVED;
  const topicReviews = REVIEW_TOPICS.map((topic) => {
    const comment = media.feedback?.topicComments?.[topic.id]?.trim();
    const result =
      media.feedback?.topicResults?.[topic.id] ?? (comment ? 'NEEDS_WORK' : 'PASS');
    return { ...topic, comment, result };
  });

  const steps: Array<{ title: string; detail: string; state: StepState }> = [
    {
      title: 'อาจารย์สร้างและส่งสื่อ',
      detail: sent ? `ส่งไปกลุ่มสาระ${media.subjectGroup}แล้ว` : 'ยังเป็นฉบับร่าง แก้ไขได้ก่อนส่ง',
      state: sent ? 'done' : 'active',
    },
    {
      title: `หัวหน้ากลุ่มสาระ${media.subjectGroup}`,
      detail: stoppedAtSubject
        ? 'ส่งผลกลับถึงอาจารย์แล้ว'
        : passedSubject
          ? 'ตรวจผ่านและส่งต่อฝ่ายวิชาการแล้ว'
          : sent
            ? 'กำลังรอรับเรื่องหรือตรวจรายละเอียด'
            : 'จะเริ่มเมื่ออาจารย์ส่งฉบับร่าง',
      state: stoppedAtSubject ? 'stopped' : passedSubject ? 'done' : sent ? 'active' : 'waiting',
    },
    {
      title: 'หัวหน้าวิชาการ',
      detail: approved
        ? 'อนุมัติขั้นสุดท้ายและเผยแพร่เข้าคลังแล้ว'
        : stoppedAtAcademic
          ? 'ส่งกลับให้อาจารย์แก้ไขจุดเล็กน้อยแล้ว'
        : passedSubject
          ? 'กำลังรอการอนุมัติขั้นสุดท้าย'
          : 'จะได้รับเรื่องเมื่อผ่านหัวหน้ากลุ่มสาระ',
      state: approved ? 'done' : stoppedAtAcademic ? 'stopped' : passedSubject ? 'active' : 'waiting',
    },
  ];

  return (
    <AppShell role={role}>
      <Link
        href="/my-media"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
      >
        <Icon name="chevronRight" className="size-3 rotate-180" />
        กลับไปฉบับร่างและสื่อของฉัน
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill>{STATUS_LABELS[media.status]}</Pill>
            <span className="text-xs text-ink-faint">{media.id}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.03em] sm:text-3xl">{media.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
            {STATUS_DESCRIPTIONS[media.status]}
          </p>
        </div>
        <Link
          href={
            media.status === MEDIA_STATUS.DRAFT
              ? `/submit?draft=${media.id}`
              : media.status === MEDIA_STATUS.REVISION ||
                  media.status === MEDIA_STATUS.ACADEMIC_REVISION
                ? `/submit?revise=${media.id}`
                : '/submit'
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast"
        >
          <Icon name="edit" className="size-4" />
          {media.status === MEDIA_STATUS.DRAFT
            ? 'แก้ไขฉบับร่าง'
            : media.status === MEDIA_STATUS.REVISION ||
                media.status === MEDIA_STATUS.ACADEMIC_REVISION
              ? 'แก้ไขตามข้อเสนอแนะ'
              : 'สร้างสื่อชิ้นใหม่'}
        </Link>
      </div>

      <SectionCard className="mt-6" title="เส้นทางการตรวจ" description="ดูได้ว่างานผ่านขั้นไหนและกำลังอยู่ที่ใคร">
        <div className="grid gap-3 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className={`rounded-xl border p-4 ${STEP_STYLE[step.state]}`}>
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full border border-current/20 text-xs font-bold">
                  {step.state === 'done' ? <Icon name="check" className="size-3.5" /> : index + 1}
                </span>
                <p className="text-sm font-semibold">{step.title}</p>
              </div>
              <p className="mt-3 text-xs leading-5 opacity-80">{step.detail}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <SectionCard
          title="ผลการตรวจส่งกลับ"
          description="แสดงคอมเมนต์แยกตามหัวข้อ เพื่อให้รู้ว่าต้องแก้ส่วนไหนและแก้อะไร"
        >
          {media.feedback ? (
            <div className="rounded-xl border border-line bg-surface/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-faint">ส่งโดย</p>
                  <p className="mt-1 text-sm font-bold text-ink">{media.feedback.from}</p>
                </div>
                <Pill
                  tone={
                    media.feedback.decision === 'APPROVED'
                      ? 'ok'
                      : media.feedback.decision === 'REJECTED'
                        ? 'danger'
                        : 'warn'
                  }
                >
                  {FEEDBACK_LABEL[media.feedback.decision]}
                </Pill>
              </div>
              <div className="mt-4 rounded-lg bg-panel p-4">
                <p className="text-[11px] font-semibold text-ink-faint">สรุปผลตรวจ</p>
                <p className="mt-1 text-sm leading-7 text-ink-muted">{media.feedback.message}</p>
              </div>

              <div className="mt-5 border-t border-line/70 pt-5">
                <p className="text-xs font-bold text-ink">
                  ผลตรวจครบ {topicReviews.length} หัวข้อที่ส่งมา
                </p>
                <p className="mt-1 text-[11px] text-ink-faint">
                  เปรียบเทียบหัวข้อในแบบฟอร์มกับผลตอบกลับของผู้ตรวจ
                </p>
                <div className="mt-3 space-y-3">
                  {topicReviews.map((topic, index) => {
                    const needsWork = topic.result === 'NEEDS_WORK';
                    return (
                      <div
                        key={topic.id}
                        className={`rounded-xl border p-4 ${
                          needsWork
                            ? 'border-status-revision/30 bg-status-revision/5'
                            : 'border-status-approved/25 bg-status-approved/5'
                        }`}
                      >
                        <div className="grid gap-4 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
                          <div className="flex gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-ink-faint">
                                หัวข้อที่ส่งในแบบฟอร์ม
                              </p>
                              <p className="mt-1 text-sm font-bold text-ink">{topic.title}</p>
                              <p className="mt-1 text-[11px] leading-5 text-ink-faint">
                                {topic.description}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-lg bg-panel/80 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] font-semibold text-ink-faint">ผลตอบกลับ</p>
                              <Pill tone={needsWork ? 'warn' : 'ok'}>
                                {needsWork ? 'ต้องแก้ไข' : 'ผ่าน'}
                              </Pill>
                            </div>
                            <p className="mt-2 text-xs leading-6 text-ink-muted">
                              {topic.comment ?? 'ตรวจผ่านแล้ว ไม่มีจุดที่ต้องแก้ไขในหัวข้อนี้'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-[11px] text-ink-faint">{media.feedback.at}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-surface/60 px-5 py-10 text-center">
              <Icon name="clock" className="mx-auto size-6 text-ink-faint" />
              <p className="mt-3 text-sm font-semibold">ยังไม่มีผลส่งกลับ</p>
              <p className="mt-1 text-xs text-ink-faint">
                เมื่อมีการให้แก้ไข ไม่ผ่าน หรืออนุมัติ ผลจะแสดงที่นี่
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="ข้อมูลสื่อ">
          <dl className="space-y-3 text-xs">
            {[
              ['กลุ่มสาระปลายทาง', media.subjectGroup],
              ['ระดับชั้น', media.grade],
              ['ประเภทสื่อ', media.type],
              ['แก้ไขล่าสุด', media.updated],
              ['เจ้าของ', media.author],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-line/70 pb-3 last:border-0 last:pb-0">
                <dt className="text-ink-faint">{label}</dt>
                <dd className="text-right font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </div>
    </AppShell>
  );
}
