// src/app/notifications/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { SectionCard, Pill } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { getViewerRole } from '@/lib/auth';
export default async function Notifications() {
  const role = await getViewerRole();
  const data = [
    [
      'ให้แก้ไขสื่อ',
      'Worksheet: Linear Equation ถูกส่งกลับพร้อมข้อเสนอแนะ 3 จุด',
      '5 นาที',
      'warn',
    ],
    ['อนุมัติแล้ว', 'การสังเคราะห์ด้วยแสงเผยแพร่เข้าคลังเรียบร้อย', '38 นาที', 'ok'],
    ['มีงานตรวจใหม่', 'ระบบมอบหมาย MED-260807-014 ให้คุณ', '1 ชม.', 'brand'],
    ['มีการดาวน์โหลด', 'สื่อของคุณถูกนำไปใช้เพิ่ม 8 ครั้งในวันนี้', '2 ชม.', 'neutral'],
  ] as const;
  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Notification Center"
        title="การแจ้งเตือน"
        description="ติดตามสถานะ การมอบหมาย ความคิดเห็น และกิจกรรมการนำสื่อไปใช้"
      />
      <SectionCard title="ล่าสุด">
        <div className="space-y-2">
          {data.map(([a, b, c, t]) => (
            <div key={a} className="flex gap-4 rounded-xl border border-line bg-surface/60 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon name="bell" className="size-4" />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{a}</p>
                  <Pill tone={t}>{c}</Pill>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
