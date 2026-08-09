// backend/src/media/media.types.ts
export const MEDIA_STATUSES = [
  'DRAFT',
  'PENDING',
  'IN_REVIEW',
  'ACADEMIC_REVIEW',
  'REVISION',
  'ACADEMIC_REVISION',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;

export type MediaStatus = (typeof MEDIA_STATUSES)[number];
