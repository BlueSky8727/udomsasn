export type SharedMediaStatus =
  | 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'ACADEMIC_REVIEW' | 'REVISION'
  | 'ACADEMIC_REVISION' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type SharedUserRole = 'TEACHER' | 'REVIEWER' | 'ACADEMIC_HEAD' | 'ADMIN';
export type SharedTransitionRule = {
  from: SharedMediaStatus;
  to: SharedMediaStatus;
  roles: readonly SharedUserRole[];
  ownerOnly: boolean;
  assigneeOnly: boolean;
  requiresReason: boolean;
  requiresComment: boolean;
  requiresUnassigned: boolean;
  requiresCompleteMetadata: boolean;
  requiresFile: boolean;
  requiresReviewComplete: boolean;
  createsNewVersion: boolean;
  label: string;
  description: string;
  intent: 'primary' | 'neutral' | 'warning' | 'danger';
};
export const STATUS_LABELS: Readonly<Record<SharedMediaStatus, string>>;
export const WORKFLOW_RULES: readonly SharedTransitionRule[];
