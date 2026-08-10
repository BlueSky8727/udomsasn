import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractTextFromFile } from '../backend/src/media/text-extractor.ts';

test('สกัดข้อความพื้นฐานจาก PDF โดยไม่รันคำสั่งที่อยู่ในเอกสาร', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'udomsasn-extract-'));
  const path = join(directory, 'sample.pdf');
  try {
    await writeFile(path, '%PDF-1.4\nBT (science lesson) Tj ET\n%%EOF', 'utf8');
    const text = await extractTextFromFile(path, 'sample.pdf');
    assert.match(text, /science lesson/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
