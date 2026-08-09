import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_UPLOAD_BYTES, validateUploadMetadata } from '../src/constants/upload.ts';

test('รับไฟล์ PDF ที่ metadata ถูกต้อง', () => {
  assert.equal(
    validateUploadMetadata(
      { name: 'lesson.pdf', size: 1_024, type: 'application/pdf' },
      { requireMime: true },
    ),
    null,
  );
});

test('ปฏิเสธชนิดไฟล์ที่ไม่ตรงกับนามสกุล', () => {
  assert.equal(
    validateUploadMetadata(
      { name: 'lesson.pdf', size: 1_024, type: 'text/html' },
      { requireMime: true },
    ),
    'ชนิดไฟล์ไม่ตรงกับนามสกุล',
  );
});

test('ปฏิเสธนามสกุลที่ไม่รองรับและไฟล์ใหญ่เกินกำหนด', () => {
  assert.match(
    validateUploadMetadata({ name: 'script.html', size: 100, type: 'text/html' }) ?? '',
    /ไม่รองรับ/,
  );
  assert.match(
    validateUploadMetadata({
      name: 'video.mp4',
      size: MAX_UPLOAD_BYTES + 1,
      type: 'video/mp4',
    }) ?? '',
    /ใหญ่เกิน/,
  );
});
