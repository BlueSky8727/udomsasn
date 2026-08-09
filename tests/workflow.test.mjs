import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkTransition,
  MEDIA_STATUS,
  USER_ROLE,
} from '../src/constants/workflow.ts';

const context = (overrides = {}) => ({
  actorRole: USER_ROLE.TEACHER,
  actorId: 'teacher-1',
  ownerId: 'teacher-1',
  assigneeId: null,
  hasCompleteMetadata: true,
  fileCount: 1,
  commentCount: 0,
  hasCompletedReview: false,
  ...overrides,
});

test('เฉพาะอาจารย์เท่านั้นที่ส่งสื่อร่างเข้าคิวได้', () => {
  assert.equal(
    checkTransition(MEDIA_STATUS.DRAFT, MEDIA_STATUS.PENDING, context()).ok,
    true,
  );
  assert.equal(
    checkTransition(
      MEDIA_STATUS.DRAFT,
      MEDIA_STATUS.PENDING,
      context({ actorRole: USER_ROLE.REVIEWER }),
    ).ok,
    false,
  );
  assert.equal(
    checkTransition(
      MEDIA_STATUS.DRAFT,
      MEDIA_STATUS.PENDING,
      context({ actorRole: USER_ROLE.ADMIN }),
    ).ok,
    false,
  );
});

test('การส่งสื่อต้องเป็นเจ้าของ กรอกข้อมูลครบ และมีไฟล์', () => {
  const notOwner = checkTransition(
    MEDIA_STATUS.DRAFT,
    MEDIA_STATUS.PENDING,
    context({ actorId: 'teacher-2' }),
  );
  assert.equal(notOwner.ok, false);
  if (!notOwner.ok) assert.equal(notOwner.code, 'NOT_OWNER');

  const missingMetadata = checkTransition(
    MEDIA_STATUS.DRAFT,
    MEDIA_STATUS.PENDING,
    context({ hasCompleteMetadata: false }),
  );
  assert.equal(missingMetadata.ok, false);
  if (!missingMetadata.ok) assert.equal(missingMetadata.code, 'METADATA_INCOMPLETE');

  const missingFile = checkTransition(
    MEDIA_STATUS.DRAFT,
    MEDIA_STATUS.PENDING,
    context({ fileCount: 0 }),
  );
  assert.equal(missingFile.ok, false);
  if (!missingFile.ok) assert.equal(missingFile.code, 'FILE_REQUIRED');
});

test('หัวหน้ากลุ่มสาระต้องเป็นผู้ถือเรื่องและตรวจครบก่อนส่งต่อ', () => {
  const incomplete = checkTransition(
    MEDIA_STATUS.IN_REVIEW,
    MEDIA_STATUS.ACADEMIC_REVIEW,
    context({
      actorRole: USER_ROLE.REVIEWER,
      actorId: 'reviewer-1',
      assigneeId: 'reviewer-1',
    }),
  );
  assert.equal(incomplete.ok, false);
  if (!incomplete.ok) assert.equal(incomplete.code, 'REVIEW_INCOMPLETE');

  assert.equal(
    checkTransition(
      MEDIA_STATUS.IN_REVIEW,
      MEDIA_STATUS.ACADEMIC_REVIEW,
      context({
        actorRole: USER_ROLE.REVIEWER,
        actorId: 'reviewer-1',
        assigneeId: 'reviewer-1',
        hasCompletedReview: true,
      }),
    ).ok,
    true,
  );
});

test('หัวหน้าวิชาการเท่านั้นที่อนุมัติขั้นสุดท้ายได้', () => {
  assert.equal(
    checkTransition(
      MEDIA_STATUS.ACADEMIC_REVIEW,
      MEDIA_STATUS.APPROVED,
      context({ actorRole: USER_ROLE.ADMIN }),
    ).ok,
    true,
  );
  assert.equal(
    checkTransition(
      MEDIA_STATUS.ACADEMIC_REVIEW,
      MEDIA_STATUS.APPROVED,
      context({ actorRole: USER_ROLE.REVIEWER }),
    ).ok,
    false,
  );
});

test('การส่งกลับแก้ไขต้องมีคอมเมนต์', () => {
  const withoutComment = checkTransition(
    MEDIA_STATUS.IN_REVIEW,
    MEDIA_STATUS.REVISION,
    context({
      actorRole: USER_ROLE.REVIEWER,
      actorId: 'reviewer-1',
      assigneeId: 'reviewer-1',
    }),
  );
  assert.equal(withoutComment.ok, false);
  if (!withoutComment.ok) assert.equal(withoutComment.code, 'COMMENT_REQUIRED');

  assert.equal(
    checkTransition(
      MEDIA_STATUS.IN_REVIEW,
      MEDIA_STATUS.REVISION,
      context({
        actorRole: USER_ROLE.REVIEWER,
        actorId: 'reviewer-1',
        assigneeId: 'reviewer-1',
        commentCount: 1,
      }),
    ).ok,
    true,
  );
});
