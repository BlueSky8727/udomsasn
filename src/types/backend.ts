import type { ReviewStage } from '@/types/media-view';
import type { ReviewJob } from '@/constants/enterprise-data';
import type { MediaStatus, UserRole } from '@/constants/workflow';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';
export type ReviewDecision = 'REVISION' | 'MINOR_REVISION' | 'REJECTED' | 'APPROVED' | 'FORWARD';
export type ReviewResultValue = 'PASS' | 'NEEDS_WORK';

export type BackendUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  /** null = ผู้สมัครยังไม่ได้กดยืนยันอีเมล */
  emailVerifiedAt?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  department: string | null;
  createdAt?: string;
  /** ใช้เป็นเลขเวอร์ชันของรูปโปรไฟล์ด้วย เปลี่ยนทุกครั้งที่บันทึกข้อมูลบัญชี */
  updatedAt?: string;
  /** มีรูปโปรไฟล์ไหม ตัว path จริงไม่ถูกส่งออกมาจากเซิร์ฟเวอร์ */
  hasAvatar?: boolean;
};

export type BackendFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  /** เวอร์ชันของสื่อตอนที่ไฟล์นี้ถูกแนบ ไฟล์รอบเก่ายังอยู่ครบ จึงต้องแยกให้เห็น */
  version: number;
  createdAt: string;
};

export type BackendReviewItem = {
  topicId: string;
  result: ReviewResultValue | null;
  comment: string | null;
};

export type BackendReview = {
  id: string;
  /** เวอร์ชันของสื่อที่ผลตรวจรอบนี้ตัดสิน คอมเมนต์ผูกกับเวอร์ชัน ไม่ใช่ผูกกับตัวสื่อ */
  mediaVersion: number;
  stage: ReviewStage;
  decision: ReviewDecision | null;
  summary: string | null;
  completedAt: string | null;
  updatedAt: string;
  reviewer: { name: string; role: UserRole };
  items: BackendReviewItem[];
};

export type BackendStatusLog = {
  id: string;
  fromStatus: MediaStatus;
  toStatus: MediaStatus;
  reason: string | null;
  createdAt: string;
  actor?: { name: string };
};

export type BackendMedia = {
  id: string;
  code: string;
  title: string;
  description: string;
  subject: string;
  subjectGroup: string;
  gradeLevel: string;
  mediaType: string;
  learningObjectives: unknown;
  assessments: unknown;
  learningProcess: string | null;
  license: string | null;
  tags: string[];
  attachmentNote: string | null;
  status: MediaStatus;
  reviewStage: ReviewStage | null;
  version: number;
  aiRisk: 'ต่ำ' | 'กลาง' | 'สูง';
  downloadCount: number;
  ownerId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string; department: string | null };
  assignee: { id: string; name: string } | null;
  files: BackendFile[];
  reviews: BackendReview[];
  statusLogs: BackendStatusLog[];
};

export type PublicMediaPage = {
  items: BackendMedia[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: { subjects: string[]; grades: string[] };
};

export type UserSearchPage = {
  items: BackendUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total: number;
    pending: number;
    assigned: number;
    active: number;
    unverified: number;
    pendingUsers: BackendUser[];
    activeByRole: Record<UserRole, number>;
  };
};

export type BackendNotification = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type AnalyticsSummary = {
  all: number;
  approved: number;
  pending: number;
  downloads: number;
  users: number;
  approvalRate: number;
  averageReviewHours: number;
  monthly: Array<{ month: string; submitted: number; approved: number }>;
  revisionReasons: Array<{ label: string; count: number }>;
  timeline: Array<{
    createdAt: string;
    fromStatus: MediaStatus;
    toStatus: MediaStatus;
    reason: string | null;
    actorName: string;
    mediaCode: string;
    mediaTitle: string;
  }>;
};

export type ReviewJobResult = ReviewJob;
