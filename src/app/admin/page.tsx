// src/app/admin/page.tsx
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard, Pill } from '@/components/ui/enterprise';
import { RoleAssignmentPanel } from '@/components/admin/role-assignment-panel';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerRole } from '@/lib/auth';

export default async function Admin() {
  const role = await getViewerRole();
  if (role !== USER_ROLE.ADMIN) notFound();

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Administration"
        title="ผู้สมัครและการแต่งตั้งบทบาท"
        description="ดูรายชื่อผู้สมัครทั้งหมด กำหนดบทบาทอาจารย์หรือหัวหน้ากลุ่มสาระ และเลือกกลุ่มสาระที่รับผิดชอบ"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="ผู้สมัครและบุคลากรทั้งหมด"
          value="146"
          detail="รวมบัญชีที่สมัครและเปิดใช้งานแล้ว"
          icon="users"
        />
        <Metric
          label="รอแต่งตั้งบทบาท"
          value="3"
          detail="บัญชีใหม่ที่หัวหน้าวิชาการต้องตรวจ"
          icon="inbox"
        />
        <Metric
          label="หัวหน้ากลุ่มสาระ"
          value="16"
          detail="8 กลุ่มสาระเดิม · 8 สาขาวิชาศาสนา"
          icon="shield"
        />
      </div>
      <SectionCard
        className="mt-6"
        title="รายชื่อผู้สมัครและบุคลากรทั้งหมด"
        description="ค้นหา กรอง และแต่งตั้งบทบาทได้จากรายชื่อเดียว ผู้สมัครใหม่จะแสดงสถานะรอแต่งตั้ง"
      >
        <RoleAssignmentPanel />
      </SectionCard>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="AI Configuration">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Provider</span>
              <b>OpenTyphoon</b>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Model</span>
              <b className="max-w-48 truncate">typhoon-v2.5-30b-a3b-instruct</b>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Temperature</span>
              <b>0.2</b>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Auto state change</span>
              <Pill tone="ok">ปิดถาวร</Pill>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Security">
          <div className="space-y-3 text-xs text-ink-muted">
            <p>✓ Supabase RLS เป็นด่านฐานข้อมูล</p>
            <p>✓ Private Storage + signed URL</p>
            <p>✓ Server-only Typhoon API key</p>
            <p>✓ Audit log ทุก workflow transition</p>
            <p>✓ Hard delete เฉพาะ DRAFT</p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
