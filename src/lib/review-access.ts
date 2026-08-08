import type { ReviewJob } from '@/constants/enterprise-data';
import { MEDIA_STATUS, USER_ROLE, type UserRole } from '@/constants/workflow';

/** ตรวจสิทธิ์เปิดพื้นที่ตรวจจากข้อมูลฝั่งเซิร์ฟเวอร์เท่านั้น */
export function canOpenReviewJob(
  job: ReviewJob,
  role: UserRole,
  subjectGroup: string | null,
): boolean {
  if (role === USER_ROLE.REVIEWER) {
    return (
      job.department === subjectGroup &&
      (job.status === MEDIA_STATUS.PENDING || job.status === MEDIA_STATUS.IN_REVIEW)
    );
  }

  return role === USER_ROLE.ADMIN && job.status === MEDIA_STATUS.ACADEMIC_REVIEW;
}
