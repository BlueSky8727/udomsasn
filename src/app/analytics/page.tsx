import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { USER_ROLE } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { getViewerRole } from '@/lib/auth';
import type { AnalyticsSummary } from '@/types/backend';

const EMPTY: AnalyticsSummary = { all: 0, approved: 0, pending: 0, downloads: 0, users: 0, approvalRate: 0, averageReviewHours: 0, monthly: [], revisionReasons: [] };
export default async function AnalyticsPage() {
  const role = await getViewerRole();
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ACADEMIC_HEAD) redirect('/forbidden');
  let data = EMPTY;
  try { data = await backendFetch<AnalyticsSummary>('/analytics/summary'); } catch { data = EMPTY; }
  const max = Math.max(1, ...data.monthly.map((item) => Math.max(item.submitted, item.approved)));
  return <AppShell role={role}><PageHeading eyebrow="Quality Assurance" title="รายงานและสถิติ" description="ข้อมูลคำนวณจากฐานข้อมูลและประวัติ workflow จริง"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="สื่อทั้งหมด" value={String(data.all)} detail={`${data.pending} รายการอยู่ระหว่างตรวจ`} icon="book"/><Metric label="ผ่านการอนุมัติ" value={String(data.approved)} detail={`${data.approvalRate}% ของทั้งหมด`} icon="check"/><Metric label="การนำไปใช้" value={String(data.downloads)} detail="จำนวนดาวน์โหลดสะสม" icon="download"/><Metric label="ผู้ใช้งาน" value={String(data.users)} detail="ทุกตำแหน่ง" icon="users"/></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><SectionCard title="แนวโน้ม 12 เดือน"><div className="flex h-64 items-end gap-2">{data.monthly.map((item) => <div key={item.month} className="flex flex-1 items-end gap-0.5"><div title={`ส่ง ${item.submitted}`} className="w-1/2 rounded-t bg-brand/40" style={{ height: `${Math.max(4, item.submitted / max * 210)}px` }}/><div title={`อนุมัติ ${item.approved}`} className="w-1/2 rounded-t bg-status-approved" style={{ height: `${Math.max(4, item.approved / max * 210)}px` }}/></div>)}</div></SectionCard><SectionCard title="เหตุผลที่ส่งกลับ/ไม่ผ่าน">{data.revisionReasons.length === 0 ? <p className="py-12 text-center text-xs text-ink-faint">ยังไม่มีข้อมูล</p> : <div className="space-y-3">{data.revisionReasons.map((item) => <div key={item.label} className="flex justify-between gap-3 rounded-lg bg-surface p-3 text-xs"><span>{item.label}</span><b>{item.count}</b></div>)}</div>}</SectionCard></div></AppShell>;
}
