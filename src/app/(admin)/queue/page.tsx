// src/app/(admin)/queue/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { QueueTable } from '@/components/review/queue-table';
import { REVIEW_JOBS } from '@/constants/enterprise-data';
import { getViewerRole } from '@/lib/auth';
export default async function QueuePage() {
  const role = await getViewerRole();
  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Review Center"
        title="คิวตรวจสอบคุณภาพ"
        description="รับเรื่อง มอบหมาย และตรวจสื่อภายใต้มาตรฐาน R1–R9"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="รอรับเรื่อง" value="12" detail="เก่าสุด 4 ชั่วโมง" icon="inbox" />
        <Metric label="กำลังตรวจ" value="5" detail="3 งานเป็นของคุณ" icon="eye" />
        <Metric label="SLA วันนี้" value="94%" detail="ภายใน 24 ชั่วโมง" icon="clock" />
      </div>
      <SectionCard
        className="mt-6"
        title="รายการตรวจ"
        description="AI เป็นข้อมูลประกอบเท่านั้น การเปลี่ยนสถานะต้องทำโดยผู้ตรวจ"
      >
        <QueueTable jobs={REVIEW_JOBS} />
      </SectionCard>
    </AppShell>
  );
}
