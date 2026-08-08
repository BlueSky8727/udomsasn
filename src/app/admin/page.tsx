// src/app/admin/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard, Pill } from '@/components/ui/enterprise';
import { getViewerRole } from '@/lib/auth';
export default async function Admin() {
  const role = await getViewerRole();
  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Administration"
        title="จัดการระบบ"
        description="ควบคุมผู้ใช้ ผู้ตรวจ Storage, AI และค่ากลาง โดยเก็บ audit ทุกการเปลี่ยนแปลง"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="ผู้ใช้"
          value="146"
          detail="อาจารย์ 122 · ผู้ตรวจ 18 · Admin 6"
          icon="users"
        />
        <Metric
          label="ผู้ตรวจพร้อมรับงาน"
          value="14"
          detail="โหลดเฉลี่ย 2.6 งาน/คน"
          icon="shield"
        />
        <Metric label="AI Provider" value="Typhoon" detail="v2.5 · เปิดใช้งาน" icon="sparkles" />
      </div>
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
