// src/app/browse/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { SectionCard } from '@/components/ui/enterprise';
import { Icon, type IconName } from '@/components/ui/icons';
import { DEMO_MEDIA } from '@/constants/mock-data';
import { MEDIA_STATUS } from '@/constants/workflow';
import { getViewerRole } from '@/lib/auth';

/**
 * หน้ารายละเอียดสื่อในคลัง — หน้าที่คนอื่นเปิดดูก่อนหยิบไปใช้สอน
 *
 * เปิดได้เฉพาะสื่อที่ APPROVED เท่านั้น ไม่ว่าคนเปิดจะมีบทบาทใด
 * เจ้าของดูงานตัวเองที่ /my-media/[id] ผู้ตรวจดูที่ /review/[id] คนละหน้ากันทั้งหมด
 */
export default async function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getViewerRole();
  const media = DEMO_MEDIA.find((item) => item.id === id);

  // สื่อที่ยังไม่ผ่านการตรวจต้องไม่โผล่ในคลังไม่ว่าทางไหน รวมถึงการเดา URL
  if (!media || media.status !== MEDIA_STATUS.APPROVED) notFound();

  const facts: readonly { icon: IconName; label: string; value: string }[] = [
    { icon: 'layers', label: 'ระดับชั้น', value: media.grade },
    { icon: 'file', label: 'ประเภทสื่อ', value: media.type },
    { icon: 'users', label: 'ผู้จัดทำ', value: media.author },
    { icon: 'clock', label: 'อัปเดตล่าสุด', value: media.updated },
    { icon: 'download', label: 'ถูกนำไปใช้', value: `${media.downloads} ครั้ง` },
  ];

  return (
    <AppShell role={role}>
      <Link
        href="/browse"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
      >
        <Icon name="chevronRight" className="size-3 rotate-180" />
        กลับไปคลังสื่อ
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_.85fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brand">
            {media.subject}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">{media.title}</h1>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {media.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[11px] text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex gap-2.5 rounded-2xl border border-status-approved/25 bg-status-approved/8 p-4">
            <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-status-approved" />
            <div>
              <p className="text-xs font-bold text-status-approved">ผ่านการตรวจและอนุมัติแล้ว</p>
              <p className="mt-1.5 text-xs leading-5 text-ink-muted">
                ผู้ตรวจยืนยันแล้วว่าสื่อชุดนี้ครบพอที่จะหยิบไปสอนต่อได้โดยไม่ต้องถามเจ้าของ
                ไฟล์ครบชุด อ้างอิงแหล่งที่มาเรียบร้อย และไม่มีข้อมูลส่วนบุคคลของนักเรียนติดมา
              </p>
            </div>
          </div>

          <SectionCard
            className="mt-6"
            title="รายละเอียดการใช้งาน"
            description="ส่วนนี้จะดึงจากข้อมูลที่เจ้าของกรอกตอนส่งสื่อ เมื่อต่อฐานข้อมูลจริงแล้ว"
          >
            <ul className="space-y-2.5">
              {[
                'สาระการเรียนรู้และแนวทางการนำไปใช้ในคาบเรียน',
                'จุดประสงค์การเรียนรู้ K/P/A พร้อมเกณฑ์การวัดผลของแต่ละข้อ',
                'ระยะเวลาที่ใช้จัดการเรียนรู้',
                'รายการไฟล์ทั้งหมดในชุด พร้อมสัญญาอนุญาตที่ระบุไว้',
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="ข้อมูลสื่อ">
            <dl className="space-y-3.5">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon name={fact.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[11px] text-ink-faint">{fact.label}</dt>
                    <dd className="truncate text-xs font-semibold">{fact.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard title="นำไปใช้">
            <button
              type="button"
              disabled
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-contrast disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="download" className="size-4" />
              ดาวน์โหลดไฟล์ทั้งชุด
            </button>
            <p className="mt-3 text-[11px] leading-5 text-ink-faint">
              ยังดาวน์โหลดไม่ได้ เพราะยังไม่ได้ต่อระบบไฟล์ เมื่อต่อแล้วไฟล์จะอยู่ใน private bucket
              และเปิดผ่าน signed URL อายุสั้นที่ตรวจสิทธิ์ก่อนออกทุกครั้ง
            </p>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
