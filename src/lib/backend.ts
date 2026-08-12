import { cookies } from 'next/headers';
import type { MediaFeedback, MediaListItem } from '@/types/media-view';
import type { ReviewJob } from '@/constants/enterprise-data';
import type { BackendMedia, BackendReview } from '@/types/backend';
import { ACCESS_TOKEN_COOKIE } from '@/constants/auth';

export const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000/api';
export { ACCESS_TOKEN_COOKIE } from '@/constants/auth';

export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function latestCompletedReview(reviews: BackendReview[]): BackendReview | undefined {
  return reviews.find((review) => Boolean(review.decision)) ?? reviews[0];
}

export function toMediaListItem(media: BackendMedia): MediaListItem {
  const review = latestCompletedReview(media.reviews ?? []);
  let feedback: MediaFeedback | undefined;
  if (review?.decision) {
    const decision: MediaFeedback['decision'] =
      review.decision === 'FORWARD' ? 'APPROVED' : review.decision;
    feedback = {
      fromRole: review.stage === 'ACADEMIC' ? 'ACADEMIC_HEAD' : 'SUBJECT_HEAD',
      from: review.reviewer?.name ?? '',
      decision,
      message: review.summary ?? '',
      topicComments: Object.fromEntries(
        (review.items ?? []).map((item) => [item.topicId, item.comment ?? '']),
      ),
      topicResults: Object.fromEntries(
        (review.items ?? [])
          .filter((item) => item.result)
          .map((item) => [item.topicId, item.result]),
      ),
      at: new Date(review.updatedAt ?? media.updatedAt).toLocaleString('th-TH'),
    };
  }

  return {
    id: media.id,
    title: media.title,
    subject: media.subject,
    subjectGroup: media.subjectGroup,
    grade: media.gradeLevel,
    type: media.mediaType,
    author: media.owner?.name ?? '',
    updated: new Date(media.updatedAt).toLocaleDateString('th-TH'),
    status: media.status,
    downloads: media.downloadCount ?? 0,
    tags: media.tags ?? [],
    accent: 'bg-brand',
    reviewStage: media.reviewStage ?? undefined,
    feedback,
  };
}

export function toReviewJob(media: BackendMedia): ReviewJob {
  return {
    id: media.id,
    title: media.title,
    owner: media.owner?.name ?? '',
    subject: media.subject,
    department: media.subjectGroup,
    grade: media.gradeLevel,
    version: media.version,
    status: media.status,
    age: new Date(media.updatedAt).toLocaleString('th-TH'),
    aiRisk: media.aiRisk ?? 'ต่ำ',
    assignee: media.assignee?.name,
  };
}
