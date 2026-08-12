import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Metric, SectionCard } from '@/components/ui/enterprise';
import { QueueTable } from '@/components/review/queue-table';
import { MEDIA_STATUS, USER_ROLE, type MediaStatus } from '@/constants/workflow';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import { backendFetch, toReviewJob } from '@/lib/backend';
import type { ReviewJob } from '@/constants/enterprise-data';
import type { BackendMedia } from '@/types/backend';

/** เป้าหมายเวลาตรวจต่อหนึ่งขั้น นับจากเวลาที่เรื่องเข้าคิว */
const SLA_HOURS = 24;

/** สถานะที่ยังไม่มีผู้ตรวจถือเรื่อง เวลาที่รออยู่จึงนับเข้า SLA */
const WAITING_STATUSES: readonly MediaStatus[] = [
  MEDIA_STATUS.PENDING,
  MEDIA_STATUS.ACADEMIC_REVIEW,
];

/**
 * เวลาที่เรื่องเข้าคิวรอบปัจจุบัน
 *
 * ใช้ status log ล่าสุดที่พาเรื่องมาอยู่สถานะนี้ ไม่ใช้ `updatedAt`
 * เพราะการแก้ไขอย่างอื่น (เช่น บันทึกร่างผลตรวจ) ก็ดัน `updatedAt` ให้ใหม่ขึ้นทั้งที่ยังรออยู่เท่าเดิม
 */
function waitingSince(media: BackendMedia): number {
  const entry = media.statusLogs.find((log) => log.toStatus === media.status);
  return new Date(entry?.createdAt ?? media.updatedAt).getTime();
}

const hoursSince = (timestamp: number) => (Date.now() - timestamp) / 3_600_000;

const formatHours = (hours: number) =>
  hours >= 24
    ? `${Math.floor(hours / 24)} วัน ${Math.round(hours % 24)} ชม.`
    : `${Math.max(0, Math.round(hours))} ชม.`;

export default async function QueuePage() {
  const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);
  if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ACADEMIC_HEAD) redirect('/forbidden');

  let media: BackendMedia[] = [];
  try {
    media = await backendFetch<BackendMedia[]>('/media/queue');
  } catch {
    media = [];
  }
  const jobs: ReviewJob[] = media.map(toReviewJob);

  const waiting = media.filter((item) => WAITING_STATUSES.includes(item.status));
  const inReview = media.filter((item) => item.status === MEDIA_STATUS.IN_REVIEW);
  const waitHours = waiting.map((item) => hoursSince(waitingSince(item)));
  const overdue = waitHours.filter((hours) => hours > SLA_HOURS).length;
  const longestWait = waitHours.length > 0 ? Math.max(...waitHours) : 0;

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Review Center"
        title={role === USER_ROLE.ACADEMIC_HEAD ? 'คิวตรวจขั้นสุดท้าย' : `คิวกลุ่มสาระ${subjectGroup ?? ''}`}
        description="ข้อมูลจาก Prisma Backend · AI เป็นข้อมูลประกอบและมนุษย์เป็นผู้ตัดสิน"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="รอตรวจ"
          value={String(waiting.length)}
          detail={waiting.length > 0 ? `รอนานสุด ${formatHours(longestWait)}` : 'ไม่มีงานค้างในคิว'}
          icon="inbox"
        />
        <Metric label="กำลังตรวจ" value={String(inReview.length)} detail="งานที่รับแล้ว" icon="eye" />
        <Metric
          label={`เกิน SLA ${SLA_HOURS} ชม.`}
          value={String(overdue)}
          detail={overdue > 0 ? 'ควรรับเรื่องรายการเหล่านี้ก่อน' : 'ทุกรายการยังอยู่ในกำหนด'}
          icon={overdue > 0 ? 'warning' : 'clock'}
        />
      </div>
      <SectionCard className="mt-6" title="รายการตรวจ">
        <QueueTable jobs={jobs} />
      </SectionCard>
    </AppShell>
  );
}
