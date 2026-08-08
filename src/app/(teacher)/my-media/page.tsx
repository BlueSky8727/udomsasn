// src/app/(teacher)/my-media/page.tsx
import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, Pill, SectionCard } from '@/components/ui/enterprise';
import { DEMO_MEDIA } from '@/constants/mock-data';
import { MEDIA_STATUS, STATUS_LABELS, type MediaStatus } from '@/constants/workflow';
import { getViewerName, getViewerRole } from '@/lib/auth';

/** สถานะที่ลูกบอลอยู่ฝั่งเจ้าของ ต้องลงมือทำอะไรสักอย่างถึงจะไปต่อได้ */
const NEEDS_OWNER_ACTION: readonly MediaStatus[] = [MEDIA_STATUS.DRAFT, MEDIA_STATUS.REVISION];

export default async function MyMedia() {
  const [role, viewer] = await Promise.all([getViewerRole(), getViewerName()]);

  // คัดเฉพาะของเจ้าของที่กำลังเข้าใช้งานตั้งแต่ฝั่งเซิร์ฟเวอร์ ห้ามส่งของคนอื่นไปให้เบราว์เซอร์
  // แล้วค่อยซ่อนด้วย CSS เพราะข้อมูลจะติดไปกับ HTML ทั้งก้อน (กฎเหล็กข้อ 2)
  const mine = DEMO_MEDIA.filter((media) => media.author === viewer);

  const published = mine.filter((media) => media.status === MEDIA_STATUS.APPROVED);
  const todo = mine.filter((media) => NEEDS_OWNER_ACTION.includes(media.status));
  const downloads = published.reduce((sum, media) => sum + media.downloads, 0);

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Contributor Workspace"
        title="สื่อของฉัน"
        description="จัดการร่าง ติดตามผลตรวจ แก้ไข และดูประวัติเวอร์ชันของสื่อที่คุณเป็นเจ้าของ"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="งานทั้งหมด"
          value={String(mine.length)}
          detail={`เจ้าของ: ${viewer}`}
          icon="folder"
        />
        <Metric
          label="ต้องดำเนินการ"
          value={String(todo.length)}
          detail={todo.length > 0 ? 'รอให้คุณแก้ไขหรือส่งตรวจ' : 'ไม่มีงานค้างอยู่ที่คุณ'}
          icon="edit"
        />
        <Metric
          label="เผยแพร่แล้ว"
          value={String(published.length)}
          detail={`ถูกดาวน์โหลดรวม ${downloads} ครั้ง`}
          icon="check"
        />
      </div>
      <SectionCard className="mt-6" title="รายการของฉัน">
        {mine.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-ink">คุณยังไม่มีสื่อในระบบ</p>
            <p className="mt-1 text-xs text-ink-faint">เริ่มจากการอัปโหลดสื่อชิ้นแรก</p>
            <Link
              href="/submit"
              className="mt-4 inline-flex rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-brand-contrast"
            >
              อัปโหลดสื่อใหม่
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map((media) => (
              <div
                key={media.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface/70 p-4 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{media.title}</p>
                    <Pill>{STATUS_LABELS[media.status]}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {media.id} · {media.subject} · {media.grade} · แก้ไขล่าสุด {media.updated}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/my-media/${media.id}`}
                    className="rounded-lg bg-brand/10 px-3 py-2 text-xs font-semibold text-brand"
                  >
                    เปิดรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
