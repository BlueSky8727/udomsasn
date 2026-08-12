import { BadRequestException } from '@nestjs/common';
import { readFile, unlink } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';

function startsWith(bytes: Buffer, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function hasOfficePath(bytes: Buffer, prefix: string): boolean {
  return bytes.includes(Buffer.from('[Content_Types].xml')) && bytes.includes(Buffer.from(prefix));
}

export async function validateUploadedFiles(files: readonly Express.Multer.File[]): Promise<void> {
  for (const file of files) {
    const bytes = await readFile(file.path);
    const extension = extname(file.originalname).toLowerCase();
    const valid =
      (extension === '.pdf' && startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) ||
      (extension === '.png' && startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
      ((extension === '.jpg' || extension === '.jpeg') && startsWith(bytes, [0xff, 0xd8, 0xff])) ||
      (extension === '.webp' && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') ||
      (extension === '.mp4' && bytes.subarray(4, 8).toString('ascii') === 'ftyp') ||
      (extension === '.docx' && startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) && hasOfficePath(bytes, 'word/')) ||
      (extension === '.pptx' && startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) && hasOfficePath(bytes, 'ppt/'));

    if (!valid) {
      throw new BadRequestException(`เนื้อหาไฟล์ ${file.originalname} ไม่ตรงกับชนิดไฟล์ที่ระบุ`);
    }
  }
}

/** ลบเฉพาะไฟล์ที่อยู่ภายใน UPLOAD_DIR ป้องกัน path ในฐานข้อมูลชี้ออกนอกพื้นที่จัดเก็บ */
export async function removeStoredFiles(paths: readonly string[]): Promise<void> {
  const uploadRoot = resolve(process.env.UPLOAD_DIR ?? 'uploads');
  await Promise.all(paths.map(async (storedPath) => {
    const absolutePath = resolve(storedPath);
    const relativePath = relative(uploadRoot, absolutePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) return;
    await unlink(absolutePath).catch(() => undefined);
  }));
}
