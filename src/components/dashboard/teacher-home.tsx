import Link from 'next/link';
import { Metric, Pill, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import type { DemoMedia } from '@/constants/mock-data';
import { MEDIA_STATUS, STATUS_LABELS, type MediaStatus } from '@/constants/workflow';

const statusTone = (status: MediaStatus): 'brand' | 'ok' | 'warn' | 'danger' | 'neutral' => {
  if (status === MEDIA_STATUS.APPROVED) return 'ok';
  if (status === MEDIA_STATUS.REVISION || status === MEDIA_STATUS.ACADEMIC_REVISION) return 'danger';
  if (status === MEDIA_STATUS.DRAFT) return 'neutral';
  return 'warn';
};

/** แดชบอร์ดอาจารย์ แสดงเฉพาะข้อมูลของเจ้าของสื่อที่ฝั่งเซิร์ฟเวอร์คัดมาแล้ว */
export function TeacherHome({ name, media }: { name: string; media: readonly DemoMedia[] }) {
  const drafts = media.filter((item) => item.status === MEDIA_STATUS.DRAFT);
  const underReview = media.filter(
    (item) =>
      item.status === MEDIA_STATUS.PENDING ||
      item.status === MEDIA_STATUS.IN_REVIEW ||
      item.status === MEDIA_STATUS.ACADEMIC_REVIEW,
  );
  const revisions = media.filter(
    (item) => item.status === MEDIA_STATUS.REVISION || item.status === MEDIA_STATUS.ACADEMIC_REVISION,
  );
  const approved = media.filter((item) => item.status === MEDIA_STATUS.APPROVED);
  const actionable = [...revisions, ...drafts, ...underReview].slice(0, 3);
  const recent = media.slice(0, 5);
  const notifications = [...revisions, ...underReview, ...approved].slice(0, 3);
  const needsAction = drafts.length + revisions.length;

  return (
    <>
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-navy-deep via-navy to-brand px-6 py-6 text-white shadow-sm sm:px-8">
        <span className="absolute inset-y-0 left-0 w-2 bg-coral" />
        <div className="school-pattern pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-55" />
        <div className="relative grid items-center gap-6 xl:grid-cols-[1fr_1.05fr]">
          <div className="xl:border-r xl:border-white/20 xl:pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">Teacher workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.035em] sm:text-4xl">สวัสดี {name}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              {needsAction > 0
                ? `มี ${needsAction} รายการที่รอให้คุณทำต่อ ตรวจสถานะและจัดการสื่อได้จากหน้านี้`
                : 'งานที่ต้องทำเรียบร้อยแล้ว คุณสามารถสร้างสื่อชิ้นใหม่หรือเปิดดูคลังสื่อได้ทันที'}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/90">งานที่ต้องทำวันนี้</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'ฉบับร่าง', value: drafts.length, icon: 'file' as const, color: 'bg-blue-400/20 text-blue-100' },
                { label: 'อยู่ระหว่างตรวจ', value: underReview.length, icon: 'search' as const, color: 'bg-amber-400/20 text-amber-100' },
                { label: 'รอแก้ไข', value: revisions.length, icon: 'edit' as const, color: 'bg-coral/30 text-white' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg bg-white/8 px-3 py-2.5 backdrop-blur-sm">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${item.color}`}>
                    <Icon name={item.icon} className="size-[18px]" />
                  </span>
                  <div>
                    <p className="text-[11px] text-white/65">{item.label}</p>
                    <p className="text-2xl font-bold leading-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/my-media?view=drafts#media-list" className="group rounded-xl">
          <Metric label="ฉบับร่าง" value={String(drafts.length)} detail="เก็บไว้แก้ไขก่อนส่งตรวจ" icon="file" className="h-full transition group-hover:-translate-y-0.5 group-hover:border-brand/35" />
        </Link>
        <Link href="/my-media?view=reviewing#media-list" className="group rounded-xl">
          <Metric label="อยู่ระหว่างตรวจ" value={String(underReview.length)} detail="กำลังตรวจโดยกลุ่มสาระหรือวิชาการ" icon="clock" className="h-full transition group-hover:-translate-y-0.5 group-hover:border-brand/35" />
        </Link>
        <Link href="/feedback" className="group rounded-xl">
          <Metric label="รอแก้ไข" value={String(revisions.length)} detail="มีข้อเสนอแนะที่ต้องดำเนินการ" icon="edit" className="h-full transition group-hover:-translate-y-0.5 group-hover:border-brand/35" />
        </Link>
        <Link href="/my-media?view=academic-approved#media-list" className="group rounded-xl">
          <Metric label="เผยแพร่แล้ว" value={String(approved.length)} detail="ผ่านการอนุมัติขั้นสุดท้าย" icon="check" className="h-full transition group-hover:-translate-y-0.5 group-hover:border-brand/35" />
        </Link>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.75fr]">
        <SectionCard title="งานที่ต้องทำต่อ" description="เรียงรายการที่ต้องดำเนินการก่อนตามสถานะปัจจุบัน">
          {actionable.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-surface/60 px-5 py-9 text-center">
              <Icon name="check" className="mx-auto size-6 text-status-approved" />
              <p className="mt-2 text-sm font-semibold">ไม่มีงานค้างอยู่</p>
            </div>
          ) : (
            <div className="divide-y divide-line/80">
              {actionable.map((item) => (
                <Link
                  key={item.id}
                  href={`/my-media/${item.id}`}
                  className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/8 text-brand">
                    <Icon name={item.status === MEDIA_STATUS.DRAFT ? 'file' : item.status === MEDIA_STATUS.REVISION || item.status === MEDIA_STATUS.ACADEMIC_REVISION ? 'edit' : 'search'} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 truncate text-[11px] text-ink-faint">{item.subject} · {item.grade} · {item.updated}</p>
                  </div>
                  <Pill tone={statusTone(item.status)}>{STATUS_LABELS[item.status]}</Pill>
                  <Icon name="chevronRight" className="size-4 text-ink-faint transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="เส้นทางการตรวจ" description="ติดตามสื่อผ่านผู้ตรวจสองระดับก่อนเผยแพร่">
          <div className="relative space-y-3">
            <span className="absolute bottom-10 left-4 top-10 w-px bg-line" />
            {[
              { step: 1, title: 'หัวหน้ากลุ่มสาระ', detail: 'ตรวจเนื้อหาและคุณภาพตามเกณฑ์กลุ่มสาระ', status: underReview.some((item) => item.reviewStage !== 'ACADEMIC') ? 'อยู่ระหว่างตรวจ' : 'รอตรวจ' },
              { step: 2, title: 'หัวหน้าวิชาการ', detail: 'ตรวจความเหมาะสมและอนุมัติเผยแพร่', status: underReview.some((item) => item.reviewStage === 'ACADEMIC') ? 'อยู่ระหว่างตรวจ' : 'รอตรวจ' },
            ].map((item) => (
              <div key={item.step} className="relative flex gap-3 rounded-lg border border-line bg-surface/55 p-3.5">
                <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">{item.step}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-ink-faint">{item.detail}</p>
                </div>
                <Pill tone="warn">{item.status}</Pill>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.75fr]">
        <SectionCard title="สื่อล่าสุด" description="สื่อที่สร้างหรืออัปเดตล่าสุดในบัญชีของคุณ">
          {recent.length === 0 ? (
            <div className="py-9 text-center text-sm text-ink-faint">ยังไม่มีสื่อในบัญชี</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] text-left text-xs">
                <thead className="border-b border-line text-[11px] font-medium text-ink-faint">
                  <tr>
                    <th className="pb-2 font-medium">ชื่อสื่อ</th>
                    <th className="pb-2 font-medium">รายวิชา</th>
                    <th className="pb-2 font-medium">สถานะ</th>
                    <th className="pb-2 text-right font-medium">อัปเดตล่าสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/80">
                  {recent.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-4">
                        <Link href={`/my-media/${item.id}`} className="flex items-center gap-2.5 font-semibold hover:text-brand">
                          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand/8 text-brand"><Icon name="file" className="size-4" /></span>
                          <span className="max-w-64 truncate">{item.title}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-muted">{item.subject}</td>
                      <td className="py-2.5"><Pill tone={statusTone(item.status)}>{STATUS_LABELS[item.status]}</Pill></td>
                      <td className="py-2.5 text-right text-ink-faint">{item.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="การแจ้งเตือน" description="ความเคลื่อนไหวล่าสุดของสื่อที่คุณส่ง">
          {notifications.length === 0 ? (
            <div className="py-9 text-center text-sm text-ink-faint">ยังไม่มีการแจ้งเตือน</div>
          ) : (
            <div className="divide-y divide-line/80">
              {notifications.map((item) => (
                <Link key={item.id} href={`/my-media/${item.id}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.status === MEDIA_STATUS.APPROVED ? 'bg-status-approved/10 text-status-approved' : item.status === MEDIA_STATUS.REVISION || item.status === MEDIA_STATUS.ACADEMIC_REVISION ? 'bg-coral/10 text-coral' : 'bg-status-pending/10 text-status-pending'}`}>
                    <Icon name={item.status === MEDIA_STATUS.APPROVED ? 'check' : item.status === MEDIA_STATUS.REVISION || item.status === MEDIA_STATUS.ACADEMIC_REVISION ? 'edit' : 'clock'} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-faint">{item.feedback?.message ?? STATUS_LABELS[item.status]}</p>
                  </div>
                  <span className="size-1.5 shrink-0 rounded-full bg-coral" />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
