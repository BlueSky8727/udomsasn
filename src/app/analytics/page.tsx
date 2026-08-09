// src/app/analytics/page.tsx
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerRole } from '@/lib/auth';
export default async function Analytics() {
  const role = await getViewerRole();
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ADMIN) notFound();

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Quality Assurance"
        title="รายงานและสถิติ"
        description="หลักฐานเชิงระบบสำหรับงานประกันคุณภาพและการวัดการนำสื่อกลับไปใช้จริง"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="ส่งสื่อเดือนนี้" value="86" detail="+12% จากเดือนก่อน" icon="upload" />
        <Metric
          label="เวลาตรวจเฉลี่ย"
          value="5.2 ชม."
          detail="เป้าหมายไม่เกิน 24 ชม."
          icon="clock"
        />
        <Metric label="Approval rate" value="81%" detail="การนำไปใช้ต่อเป็นสาเหตุแก้ไขสูงสุด" icon="check" />
        <Metric
          label="Reuse events"
          value="1,284"
          detail="ดาวน์โหลดจากผู้ใช้ที่ไม่ใช่เจ้าของ"
          icon="refresh"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="แนวโน้มการส่งและอนุมัติ">
          <div className="flex h-64 items-end gap-3 rounded-xl bg-surface p-5">
            {[38, 52, 47, 64, 59, 71, 83, 68, 90, 76, 88, 96].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end gap-1">
                <div className="rounded-t-md bg-brand/70" style={{ height: `${v * 1.7}px` }} />
                <span className="text-center text-[9px] text-ink-faint">{i + 1}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="เหตุผลที่ถูกให้แก้ไข">
          <div className="space-y-4">
            {[
              ['นำไปใช้ต่อไม่ได้', 34],
              ['แหล่งที่มา/ลิขสิทธิ์', 27],
              ['ข้อมูลส่วนบุคคล', 18],
              ['ข้อมูลประกอบไม่ครบ', 14],
              ['อื่น ๆ', 7],
            ].map(([x, v]) => (
              <div key={String(x)}>
                <div className="flex justify-between text-xs">
                  <span>{x}</span>
                  <b>{v}%</b>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
