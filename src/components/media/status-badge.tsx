import { STATUS_LABELS, type MediaStatus } from '@/constants/workflow';

/**
 * ป้ายสถานะ ใช้ที่เดียวกันทั้งหน้าคิว หน้าสื่อของฉัน และหน้าตรวจ
 * ข้อความดึงจาก STATUS_LABELS ไม่เขียนซ้ำ (กฎเหล็กข้อ 9)
 */

const TONE: Record<MediaStatus, string> = {
  DRAFT: 'bg-status-draft/12 text-status-draft ring-status-draft/25',
  PENDING: 'bg-status-pending/12 text-status-pending ring-status-pending/30',
  IN_REVIEW: 'bg-status-in-review/12 text-status-in-review ring-status-in-review/30',
  ACADEMIC_REVIEW: 'bg-brand/12 text-brand ring-brand/30',
  REVISION: 'bg-status-revision/12 text-status-revision ring-status-revision/30',
  ACADEMIC_REVISION: 'bg-status-revision/12 text-status-revision ring-status-revision/30',
  APPROVED: 'bg-status-approved/12 text-status-approved ring-status-approved/30',
  REJECTED: 'bg-status-rejected/12 text-status-rejected ring-status-rejected/30',
  ARCHIVED: 'bg-status-archived/12 text-status-archived ring-status-archived/25',
};

type StatusBadgeProps = {
  status: MediaStatus;
  size?: 'sm' | 'md';
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset ${TONE[status]} ${sizing}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
