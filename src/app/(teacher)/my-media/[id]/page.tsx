// src/app/(teacher)/my-media/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { Icon } from '@/components/ui/icons';
import { PagePlaceholder } from '@/components/ui/page-placeholder';
import { DEMO_MEDIA } from '@/constants/mock-data';
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from '@/constants/workflow';
import { getViewerName, getViewerRole } from '@/lib/auth';

/**
 * หน้ารายละเอียดสื่อ **ฝั่งเจ้าของ** — คนละหน้ากับ /review/[id] ที่เป็นที่ทำงานของผู้ตรวจ
 *
 * เจ้าของมาดูว่างานตัวเองถึงไหนแล้วและถูกติอะไร ไม่ใช่มาให้คะแนน R1–R9 เอง
 * ห้ามรวมสองหน้านี้เข้าด้วยกันไม่ว่ากรณีใด
 */
export default async function MyMediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, viewer] = await Promise.all([getViewerRole(), getViewerName()]);
  const media = DEMO_MEDIA.find((item) => item.id === id);

  // เปิดได้เฉพาะเจ้าของ ถ้าไม่ใช่ให้ตอบ 404 เหมือนไม่มีหน้านี้อยู่
  // ไม่ตอบ 403 เพราะการบอกว่า "มีอยู่แต่คุณไม่มีสิทธิ์" คือการยืนยันว่ารหัสนี้มีจริงในระบบ
  if (!media || media.author !== viewer) notFound();

  return (
    <AppShell role={role}>
      <Link
        href="/my-media"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
      >
        <Icon name="chevronRight" className="size-3 rotate-180" />
        กลับไปสื่อของฉัน
      </Link>
      <PagePlaceholder
        title={media.title}
        description={`${media.id} · ${media.subject} · ${media.grade} · สถานะ ${STATUS_LABELS[media.status]} — ${STATUS_DESCRIPTIONS[media.status]}`}
        next={[
          'ประวัติเวอร์ชันทุกรอบที่ส่งตรวจ พร้อมไฟล์ของแต่ละเวอร์ชัน',
          'ความคิดเห็นจากผู้ตรวจ แยกตามเวอร์ชัน เพื่อย้อนดูได้ว่ารอบไหนถูกติอะไร',
          'ปุ่มส่งฉบับแก้ไข ซึ่งจะสร้างเวอร์ชันใหม่เสมอ ไม่ทับไฟล์เดิม',
          'ประวัติการเปลี่ยนสถานะทั้งหมดจาก status_logs',
        ]}
      />
    </AppShell>
  );
}
