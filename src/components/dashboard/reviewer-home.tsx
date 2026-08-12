import Link from 'next/link';
import { Metric, Pill, SectionCard, TimeBadge } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import type { ReviewJob } from '@/constants/enterprise-data';
import { MEDIA_STATUS, STATUS_LABELS } from '@/constants/workflow';

/**
 * แดชบอร์ดของหัวหน้ากลุ่มสาระ — เน้นคำถามว่า "เรื่องไหนต้องตรวจต่อเป็นลำดับถัดไป"
 *
 * ผู้เรียกต้องส่งเฉพาะคิวที่ผู้ตรวจคนนี้มีสิทธิ์เห็นมาให้แล้ว คอมโพเนนต์นี้ไม่รับ
 * สถิติภาพรวมของผู้ดูแลระบบและไม่แสดงสื่อส่วนตัวของอาจารย์
 */
export function ReviewerHome({
  subjectGroup,
  jobs,
}: {
  subjectGroup: string | null;
  jobs: readonly ReviewJob[];
}) {
  const waiting = jobs.filter((job) => job.status === MEDIA_STATUS.PENDING);
  const inReview = jobs.filter((job) => job.status === MEDIA_STATUS.IN_REVIEW);
  const highRisk = jobs.filter(
    (job) =>
      job.aiRisk === 'สูง' &&
      (job.status === MEDIA_STATUS.PENDING || job.status === MEDIA_STATUS.IN_REVIEW),
  );
  const actionable = jobs.filter(
    (job) => job.status === MEDIA_STATUS.PENDING || job.status === MEDIA_STATUS.IN_REVIEW,
  );

  return (
    <>
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-navy-deep via-navy to-brand p-7 text-white shadow-sm sm:p-8">
        <span className="absolute inset-y-0 left-0 w-2 bg-coral" />
        <div className="school-pattern pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-55" />
        <div className="relative grid gap-7 xl:grid-cols-[1.45fr_.75fr]">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
              หัวหน้ากลุ่มสาระ{subjectGroup ?? 'ที่ยังไม่ได้กำหนด'}
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">
              จัดคิวให้ชัด ตรวจงานให้จบ
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
              แสดงเฉพาะสื่อที่อาจารย์ส่งมายังกลุ่มสาระ{subjectGroup ?? 'ของคุณ'} · มี{' '}
              {waiting.length} เรื่องรอรับ และ {inReview.length} เรื่องกำลังตรวจ
              {highRisk.length > 0
                ? ` โดยมี ${highRisk.length} เรื่องที่ AI ปักธงความเสี่ยงสูงให้ตรวจเป็นพิเศษ`
                : ' ขณะนี้ไม่มีเรื่องความเสี่ยงสูงในคิว'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/queue"
                className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-strong"
              >
                <Icon name="inbox" className="size-4" />
                เปิดคิวตรวจ
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Icon name="chart" className="size-4" />
                ดูรายงาน QA
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/8 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-coral/25 text-white">
                <Icon name="shield" />
              </span>
              <div>
                <p className="text-sm font-bold">เป้าหมายวันนี้</p>
                <p className="text-xs text-white/60">ปิดงานในมือก่อนรับเรื่องใหม่</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/8 p-3">
                <span className="text-xs text-white/65">งานกำลังตรวจ</span>
                <strong className="text-lg">{inReview.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/8 p-3">
                <span className="text-xs text-white/65">งานเสี่ยงสูง</span>
                <strong className="text-lg text-status-rejected">{highRisk.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="รอรับเรื่อง"
          value={String(waiting.length)}
          detail={waiting.length > 0 ? `เก่าสุด ${waiting.at(-1)?.age ?? '-'}` : 'ไม่มีเรื่องรอรับ'}
          icon="inbox"
        />
        <Metric
          label="กำลังตรวจ"
          value={String(inReview.length)}
          detail="อยู่ในความรับผิดชอบของผู้ตรวจ"
          icon="eye"
        />
        <Metric
          label="AI ปักธงสูง"
          value={String(highRisk.length)}
          detail="ต้องอ่านหลักฐานและตัดสินโดยคน"
          icon="warning"
        />
        <Metric label="SLA วันนี้" value="94%" detail="เป้าหมายตรวจภายใน 24 ชั่วโมง" icon="clock" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_.8fr]">
        <SectionCard title="คิวที่ต้องลงมือ" description="งานรอรับและงานที่กำลังตรวจ เรียงตามคิวปัจจุบัน">
          {actionable.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
              <Icon name="check" className="mx-auto size-6 text-status-approved" />
              <p className="mt-3 text-sm font-semibold">ตรวจครบทุกเรื่องแล้ว</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionable.map((job) => (
                <Link
                  href={`/review/${job.id}`}
                  key={job.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface/60 p-4 transition hover:border-brand/25 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      {job.aiRisk === 'สูง' && <Icon name="warning" className="size-4 shrink-0 text-status-rejected" />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-ink-faint">
                        {job.id} · {job.owner} · {job.subject} · {job.grade}
                      </p>
                      <TimeBadge>รอมา {job.age}</TimeBadge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill>{STATUS_LABELS[job.status]}</Pill>
                    <Icon name="chevronRight" className="size-4 text-ink-faint" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="หลักการตัดสิน" description="AI ช่วยชี้จุด แต่ไม่เปลี่ยนสถานะแทนผู้ตรวจ">
          <div className="space-y-3">
            {[
              ['อ่านสื่อและตรวจให้ครบทุกหัวข้อ', 'ระบุให้ชัดว่าจุดใดเรียบร้อยหรือควรแก้'],
              ['อ่านธงจาก AI', 'ใช้เป็นเบาะแสและตรวจหลักฐานด้วยตนเอง'],
              ['เขียนเหตุผลให้ชัด', 'ทุกการให้แก้หรือไม่ผ่านต้องย้อนดูได้'],
            ].map(([title, detail], index) => (
              <div key={title} className="flex gap-3 rounded-xl border border-line bg-surface/60 p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-faint">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
