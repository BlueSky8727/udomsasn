import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { USER_ROLE } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { getViewerRole } from '@/lib/auth';
import type { AnalyticsSummary } from '@/types/backend';

const EMPTY: AnalyticsSummary = {
  all: 0,
  approved: 0,
  pending: 0,
  downloads: 0,
  users: 0,
  approvalRate: 0,
  averageReviewHours: 0,
  monthly: [],
  revisionReasons: [],
  timeline: [],
};

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/** `2026-08` → `ส.ค. 69` (พ.ศ. สองหลัก) ให้ป้ายสั้นพอที่จะวางใต้แท่งได้ 12 เดือน */
function monthLabel(key: string): string {
  const parts = key.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const name = THAI_MONTHS[month - 1];
  if (!name || !Number.isFinite(year)) return key;
  return `${name} ${String((year + 543) % 100).padStart(2, '0')}`;
}

const BAR_MAX_PX = 190;

export default async function AnalyticsPage() {
  const role = await getViewerRole();
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ACADEMIC_HEAD) redirect('/forbidden');

  let data = EMPTY;
  try {
    data = await backendFetch<AnalyticsSummary>('/analytics/summary');
  } catch {
    data = EMPTY;
  }
  const max = Math.max(1, ...data.monthly.map((item) => Math.max(item.submitted, item.approved)));

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Quality Assurance"
        title="รายงานและสถิติ"
        description="ข้อมูลคำนวณจากฐานข้อมูลและประวัติ workflow จริง"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="สื่อทั้งหมด"
          value={String(data.all)}
          detail={`${data.pending} รายการอยู่ระหว่างตรวจ`}
          icon="book"
        />
        <Metric
          label="ผ่านการอนุมัติ"
          value={String(data.approved)}
          detail={`${data.approvalRate}% ของทั้งหมด`}
          icon="check"
        />
        <Metric
          label="เวลาเฉลี่ยในการตรวจ"
          value={`${data.averageReviewHours.toLocaleString('th-TH', { maximumFractionDigits: 1 })} ชม.`}
          detail="จากรอบตรวจที่เสร็จใน 12 เดือน"
          icon="clock"
        />
        <Metric
          label="การนำไปใช้"
          value={String(data.downloads)}
          detail="จำนวนผู้ที่นำสื่อไปใช้"
          icon="download"
        />
        <Metric label="ผู้ใช้งาน" value={String(data.users)} detail="ทุกตำแหน่ง" icon="users" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="แนวโน้ม 12 เดือน">
          <div className="mb-4 flex items-center gap-4 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-brand/40" />
              ส่งเข้าตรวจ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-status-approved" />
              อนุมัติแล้ว
            </span>
          </div>
          {data.monthly.length === 0 ? (
            <p className="py-16 text-center text-xs text-ink-faint">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <caption className="sr-only">
                  จำนวนสื่อที่ส่งเข้าตรวจและที่อนุมัติแล้ว แยกตามเดือน ย้อนหลัง 12 เดือน
                </caption>
                <tbody>
                  <tr className="align-bottom">
                    {data.monthly.map((item) => (
                      <td key={item.month} className="px-0.5">
                        <div className="flex h-52 items-end justify-center gap-0.5">
                          <div
                            className="w-2.5 rounded-t bg-brand/40 sm:w-3"
                            style={{ height: `${Math.max(3, (item.submitted / max) * BAR_MAX_PX)}px` }}
                          />
                          <div
                            className="w-2.5 rounded-t bg-status-approved sm:w-3"
                            style={{ height: `${Math.max(3, (item.approved / max) * BAR_MAX_PX)}px` }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {data.monthly.map((item) => (
                      <th
                        key={item.month}
                        scope="col"
                        className="px-0.5 pt-2 text-center text-[9px] font-medium leading-tight text-ink-faint"
                      >
                        {monthLabel(item.month)}
                        <span className="mt-1 block font-semibold text-ink-muted">
                          {item.submitted}/{item.approved}
                        </span>
                      </th>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="เหตุผลที่ส่งกลับ/ไม่ผ่าน">
          {data.revisionReasons.length === 0 ? (
            <p className="py-12 text-center text-xs text-ink-faint">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {data.revisionReasons.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between gap-3 rounded-lg bg-surface p-3 text-xs"
                >
                  <span>{item.label}</span>
                  <b>{item.count}</b>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
