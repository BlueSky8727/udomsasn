import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MAX_UPLOAD_BYTES, validateUploadMetadata } from '../src/constants/upload.ts';
import { validateUploadedFiles } from '../backend/src/media/upload-security.ts';

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

test('backend ตรวจ signature จริง ไม่เชื่อแค่นามสกุลและ MIME จาก browser', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'udomsasn-upload-'));
  const validPath = join(directory, 'valid.pdf');
  const fakePath = join(directory, 'fake.pdf');
  try {
    await writeFile(validPath, '%PDF-1.4\n%%EOF');
    await writeFile(fakePath, '<script>not a pdf</script>');
    await validateUploadedFiles([{ path: validPath, originalname: 'valid.pdf' }]);
    await assert.rejects(
      validateUploadedFiles([{ path: fakePath, originalname: 'fake.pdf' }]),
      /เนื้อหาไฟล์ fake\.pdf ไม่ตรง/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
