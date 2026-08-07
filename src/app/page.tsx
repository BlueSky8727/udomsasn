// src/app/page.tsx
import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { Icon } from '@/components/ui/icons';
import { Metric, SectionCard, Pill } from '@/components/ui/enterprise';
import { QA_STATS, REVIEW_JOBS, TIMELINE } from '@/constants/enterprise-data';
import { STATUS_LABELS } from '@/constants/workflow';
import { getViewerRole } from '@/lib/auth';
const icons: import('@/components/ui/icons').IconName[] = ['book', 'inbox', 'check', 'refresh'];
export default async function HomePage() {
  const role = await getViewerRole();
  return (
    <AppShell role={role}>
      <section className="relative overflow-hidden rounded-[30px] border border-brand/15 bg-gradient-to-br from-brand/14 via-panel to-panel p-7 shadow-sm sm:p-9">
        <div className="absolute -right-16 -top-20 size-72 rounded-full bg-brand/8 blur-2xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1.5fr_.8fr]">
          <div>
            <Pill>Teaching Asset Management Platform</Pill>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">
              คลังสื่อการสอนที่ตรวจสอบคุณภาพ
              <br />
              และตรวจสอบย้อนกลับได้จริง
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted">
              จัดการตั้งแต่ร่าง อัปโหลด เวอร์ชัน คิวตรวจ AI คัดกรอง
              ไปจนถึงเผยแพร่และรายงานประกันคุณภาพ โดยให้มนุษย์เป็นผู้ตัดสินขั้นสุดท้ายเสมอ
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast"
              >
                <Icon name="upload" className="size-4" />
                ส่งสื่อใหม่
              </Link>
              <Link
                href="/queue"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel/80 px-4 py-2.5 text-sm font-semibold"
              >
                <Icon name="inbox" className="size-4" />
                เปิดคิวตรวจ
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line/80 bg-surface/70 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-status-approved/10 text-status-approved">
                <Icon name="shield" />
              </span>
              <div>
                <p className="text-sm font-bold">Quality Workflow Online</p>
                <p className="text-xs text-ink-faint">
                  State machine 7 สถานะ · Audit ทุก transition
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['รอตรวจ', '12'],
                ['กำลังตรวจ', '5'],
                ['แก้ไข', '8'],
                ['เผยแพร่วันนี้', '14'],
              ].map(([a, b]) => (
                <div key={a} className="rounded-xl border border-line bg-panel p-3">
                  <p className="text-2xl font-bold">{b}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QA_STATS.map((s, i) => (
          <Metric key={s.label} {...s} icon={icons[i] ?? 'chart'} />
        ))}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_.8fr]">
        <SectionCard title="งานที่ต้องติดตาม" description="เรียงตามสถานะและเวลาที่อยู่ในคิว">
          <div className="space-y-3">
            {REVIEW_JOBS.map((j) => (
              <Link
                href={`/review/${j.id}`}
                key={j.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface/60 p-4 transition hover:border-brand/25 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{j.title}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {j.id} · {j.owner} · {j.subject} · {j.grade} · v{j.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={j.aiRisk === 'สูง' ? 'danger' : j.aiRisk === 'กลาง' ? 'warn' : 'ok'}>
                    AI risk {j.aiRisk}
                  </Pill>
                  <Pill>{STATUS_LABELS[j.status]}</Pill>
                  <Icon name="chevronRight" className="size-4 text-ink-faint" />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Audit ล่าสุด" description="เหตุการณ์สำคัญที่เกิดขึ้นในระบบ">
          <div className="space-y-5">
            {TIMELINE.map((t) => (
              <div key={t.time} className="flex gap-3">
                <span className="text-[11px] font-semibold text-brand">{t.time}</span>
                <div>
                  <p className="text-xs font-semibold">{t.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-faint">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
