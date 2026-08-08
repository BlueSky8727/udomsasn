import Link from 'next/link';
import { Metric, Pill, SectionCard } from '@/components/ui/enterprise';
import { Icon, type IconName } from '@/components/ui/icons';
import type { ReviewJob } from '@/constants/enterprise-data';
import { MEDIA_STATUS } from '@/constants/workflow';

type AdminMetric = {
  label: string;
  value: string;
  detail: string;
};

type AuditEvent = {
  time: string;
  title: string;
  detail: string;
};

const metricIcons: readonly IconName[] = ['book', 'inbox', 'check', 'refresh'];

/** แดชบอร์ดหัวหน้าวิชาการ: แต่งตั้งบทบาทและตัดสินงานรอบสุดท้าย */
export function AdminHome({
  metrics,
  jobs,
  timeline,
}: {
  metrics: readonly AdminMetric[];
  jobs: readonly ReviewJob[];
  timeline: readonly AuditEvent[];
}) {
  const waiting = jobs.filter((job) => job.status === MEDIA_STATUS.PENDING).length;
  const inReview = jobs.filter((job) => job.status === MEDIA_STATUS.IN_REVIEW).length;
  const academicWaiting = jobs.filter(
    (job) => job.status === MEDIA_STATUS.ACADEMIC_REVIEW,
  ).length;
  const academicJobs = jobs.filter((job) => job.status === MEDIA_STATUS.ACADEMIC_REVIEW);
  const revision = jobs.filter(
    (job) =>
      job.status === MEDIA_STATUS.REVISION || job.status === MEDIA_STATUS.ACADEMIC_REVISION,
  ).length;
  const highRisk = jobs.filter((job) => job.aiRisk === 'สูง').length;

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-brand/15 bg-gradient-to-br from-brand/14 via-panel to-panel p-7 shadow-sm sm:p-9">
        <div className="absolute -right-16 -top-20 size-72 rounded-full bg-brand/8 blur-2xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1.45fr_.8fr]">
          <div>
            <Pill>แดชบอร์ดหัวหน้าวิชาการ</Pill>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">
              แต่งตั้งคนให้ถูกบทบาท
              <br />
              ตรวจงานรอบสุดท้ายให้จบ
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">
              ดูรายชื่อผู้สมัครทั้งหมด แต่งตั้งหัวหน้ากลุ่มสาระ และตรวจสื่อที่หัวหน้ากลุ่มสาระ
              ส่งต่อมา เมื่ออนุมัติแล้วระบบจะส่งผลกลับให้อาจารย์เจ้าของสื่อ
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/queue"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-strong"
              >
                <Icon name="inbox" className="size-4" />
                ตรวจงานที่ส่งต่อมา
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel/80 px-4 py-2.5 text-sm font-semibold transition hover:border-brand/30"
              >
                <Icon name="users" className="size-4" />
                แต่งตั้งบทบาท
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line/80 bg-surface/70 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-status-approved/10 text-status-approved">
                  <Icon name="check" />
                </span>
                <div>
                  <p className="text-sm font-bold">งานของคุณวันนี้</p>
                  <p className="text-xs text-ink-faint">รายการที่ต้องแต่งตั้งหรือตัดสิน</p>
                </div>
              </div>
              <Pill tone={academicWaiting > 0 ? 'warn' : 'ok'}>
                {academicWaiting > 0 ? 'มีงานรอตรวจ' : 'เรียบร้อย'}
              </Pill>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['รอตรวจขั้นสุดท้าย', academicWaiting],
                ['ผู้สมัครรอแต่งตั้ง', 3],
                ['กลุ่มสาระกำลังตรวจ', inReview],
                ['ส่งกลับแก้ไข', revision],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-panel p-3">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <Metric key={metric.label} {...metric} icon={metricIcons[index] ?? 'chart'} />
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <SectionCard
          title="งานที่หัวหน้ากลุ่มสาระส่งต่อมา"
          description="หัวหน้ากลุ่มสาระตรวจครบแล้ว รอหัวหน้าวิชาการตรวจและตัดสินขั้นสุดท้าย"
        >
          <div className="space-y-3">
            {academicJobs.map((job) => (
              <Link
                key={job.id}
                href={`/review/${job.id}`}
                className="group flex flex-col gap-4 rounded-xl border border-line bg-surface/60 p-4 transition hover:border-brand/35 hover:bg-brand/[.035] sm:flex-row sm:items-center"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon name="file" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{job.title}</p>
                    <Pill tone="warn">รอตรวจขั้นสุดท้าย</Pill>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {job.owner} · {job.department}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {job.id} · {job.grade} · v{job.version} · ส่งต่อมาเมื่อ {job.age}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <Pill
                    tone={
                      job.aiRisk === 'สูง' ? 'danger' : job.aiRisk === 'กลาง' ? 'warn' : 'ok'
                    }
                  >
                    AI {job.aiRisk}
                  </Pill>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    ตรวจขั้นสุดท้าย
                    <Icon name="chevronRight" className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
            {academicJobs.length === 0 && (
              <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-line bg-surface/50 text-center">
                <div>
                  <p className="text-sm font-semibold">ยังไม่มีงานรอตรวจขั้นสุดท้าย</p>
                  <p className="mt-1 text-xs text-ink-faint">งานจะปรากฏเมื่อหัวหน้ากลุ่มสาระส่งต่อมา</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="ผู้สมัครรอแต่งตั้ง"
          description="ตรวจรายชื่อและกำหนดว่าใครเป็นอาจารย์หรือหัวหน้ากลุ่มสาระ"
        >
          <div className="rounded-xl border border-status-pending/20 bg-status-pending/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-status-pending/10 text-status-pending">
                <Icon name="users" className="size-5" />
              </span>
              <Pill tone="warn">ต้องดำเนินการ</Pill>
            </div>
            <p className="mt-5 text-4xl font-bold tracking-[-.04em]">3</p>
            <p className="mt-1 text-xs text-ink-muted">บัญชีใหม่ยังไม่ได้ยืนยันบทบาท</p>
            <Link
              href="/admin"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast"
            >
              เปิดรายชื่อทั้งหมด
              <Icon name="chevronRight" className="size-4" />
            </Link>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-ink-faint">
            ผู้ที่เป็นหัวหน้ากลุ่มสาระจะเห็นเฉพาะคิวตรวจของกลุ่มสาระที่ได้รับมอบหมาย
          </p>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.9fr]">
        <SectionCard title="ภาพรวมงานระหว่างทาง" description="งานที่ยังอยู่กับกลุ่มสาระหรือรออาจารย์ส่งฉบับแก้ไข">
          <div className="space-y-3">
            {[
              {
                title: 'คิวรอตรวจสะสม',
                detail: `${waiting} รายการยังไม่มีผู้รับเรื่อง ควรกระจายงานก่อนเกิน SLA`,
                value: `${waiting} งาน`,
                tone: 'warn' as const,
                icon: 'inbox' as const,
              },
              {
                title: 'งานถูกส่งกลับแก้ไข',
                detail: `${revision} รายการกำลังรอเจ้าของส่งเวอร์ชันใหม่`,
                value: `${revision} งาน`,
                tone: 'neutral' as const,
                icon: 'refresh' as const,
              },
              {
                title: 'ธงความเสี่ยงสูงจาก AI',
                detail: 'ผู้ตรวจต้องอ่านหลักฐานประกอบก่อนตัดสินทุกครั้ง',
                value: `${highRisk} งาน`,
                tone: highRisk > 0 ? ('danger' as const) : ('ok' as const),
                icon: 'warning' as const,
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon name={item.icon} className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-faint">{item.detail}</p>
                </div>
                <Pill tone={item.tone}>{item.value}</Pill>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Audit ล่าสุด" description="เหตุการณ์สำคัญที่เกิดขึ้นในระบบ">
          <div className="space-y-5">
            {timeline.map((event) => (
              <div key={`${event.time}-${event.title}`} className="flex gap-3">
                <span className="text-[11px] font-semibold text-brand">{event.time}</span>
                <div>
                  <p className="text-xs font-semibold">{event.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-faint">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
