import type { MediaStatus } from '@/constants/workflow';
import type { ReviewTopicId } from '@/constants/review-topics';

export type ReviewStage = 'SUBJECT_GROUP' | 'ACADEMIC';

export type MediaFeedback = {
  fromRole: 'SUBJECT_HEAD' | 'ACADEMIC_HEAD';
  from: string;
  decision: 'REVISION' | 'MINOR_REVISION' | 'REJECTED' | 'APPROVED';
  message: string;
  topicComments?: Partial<Record<ReviewTopicId, string>>;
  topicResults?: Partial<Record<ReviewTopicId, 'PASS' | 'NEEDS_WORK'>>;
  at: string;
};

export type MediaListItem = {
  id: string;
  title: string;
  subject: string;
  subjectGroup: string;
  grade: string;
  type: string;
  author: string;
  updated: string;
  status: MediaStatus;
  downloads: number;
  tags: string[];
  accent: string;
  reviewStage?: ReviewStage;
  feedback?: MediaFeedback;
};
