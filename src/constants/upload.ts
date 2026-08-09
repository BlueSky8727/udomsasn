/**
 * upload.ts — กติกาของไฟล์ที่รับได้
 *
 * ค่าที่นี่ใช้กับฝั่ง client เพื่อบอกผู้ใช้ตั้งแต่ตอนเลือกไฟล์
 * **แต่ยังไม่ใช่การป้องกัน** ฝั่งเซิร์ฟเวอร์ต้องตรวจซ้ำทุกครั้ง (กฎเหล็กข้อ 2)
 * ของจริงให้เซิร์ฟเวอร์อ่านเพดานขนาดจาก MAX_UPLOAD_BYTES ใน env
 */

/** เพดานขนาดต่อไฟล์ ค่าเริ่มต้น 50MB (ตรงกับ .env.example) */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
/** จำกัดจำนวนและขนาดรวม ป้องกันหน้าเว็บเก็บไฟล์จำนวนมากเกินไปในหน่วยความจำ */
export const MAX_UPLOAD_FILES = 10;
export const MAX_TOTAL_UPLOAD_BYTES = 200 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.mp4',
  '.mp3',
  '.wav',
  '.zip',
] as const;

/** ค่าไปใส่ใน accept ของ input[type=file] */
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',');

const MIME_TYPES_BY_EXTENSION: Readonly<Record<string, readonly string[]>> = {
  pdf: ['application/pdf'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  mp4: ['video/mp4'],
  mp3: ['audio/mpeg', 'audio/mp3'],
  wav: ['audio/wav', 'audio/x-wav'],
  zip: ['application/zip', 'application/x-zip-compressed'],
};

export type FileKind = 'pdf' | 'slide' | 'doc' | 'sheet' | 'image' | 'video' | 'audio' | 'other';

const EXTENSION_KIND: Record<string, FileKind> = {
  pdf: 'pdf',
  ppt: 'slide',
  pptx: 'slide',
  doc: 'doc',
  docx: 'doc',
  xls: 'sheet',
  xlsx: 'sheet',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  mp4: 'video',
  mp3: 'audio',
  wav: 'audio',
};

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  pdf: 'PDF',
  slide: 'สไลด์',
  doc: 'เอกสาร',
  sheet: 'ตาราง',
  image: 'รูปภาพ',
  video: 'วิดีโอ',
  audio: 'เสียง',
  other: 'ไฟล์',
};

export const extensionOf = (fileName: string): string =>
  fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();

export const fileKindOf = (fileName: string): FileKind =>
  EXTENSION_KIND[extensionOf(fileName)] ?? 'other';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * เปิดดูในแท็บใหม่ได้ไหม
 *
 * จงใจอนุญาตเฉพาะ PDF กับรูปภาพ เพราะ blob: URL ใช้ origin เดียวกับเว็บเรา
 * ถ้าเปิดไฟล์ที่รันสคริปต์ได้ (เช่น .html) สคริปต์นั้นจะทำงานบน origin ของระบบ
 * ซึ่งขัดกับกฎเหล็กข้อ 7 ที่ถือว่าไฟล์ของผู้ใช้เป็นข้อมูลที่เชื่อไม่ได้
 */
export function isPreviewable(file: File): boolean {
  return file.type === 'application/pdf' || file.type.startsWith('image/');
}

export type UploadFileMetadata = Pick<File, 'name' | 'size' | 'type'>;

/**
 * ตรวจ metadata ของไฟล์ร่วมกันได้ทั้ง client และ server
 * ฝั่ง server ยังต้องตรวจ magic bytes ของไฟล์จริงอีกครั้งก่อนบันทึกเสมอ
 */
export function validateUploadMetadata(
  file: UploadFileMetadata,
  options: { maxBytes?: number; requireMime?: boolean } = {},
): string | null {
  const ext = `.${extensionOf(file.name)}`;
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `ไม่รองรับไฟล์นามสกุล ${ext}`;
  }
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    return `ไฟล์ใหญ่เกิน ${formatBytes(maxBytes)}`;
  }
  if (file.size === 0) {
    return 'ไฟล์ว่าง';
  }

  const expectedMimes = MIME_TYPES_BY_EXTENSION[extensionOf(file.name)] ?? [];
  if (options.requireMime && !file.type) return 'ไม่พบชนิดไฟล์';
  if (file.type && expectedMimes.length > 0 && !expectedMimes.includes(file.type.toLowerCase())) {
    return 'ชนิดไฟล์ไม่ตรงกับนามสกุล';
  }

  return null;
}

/** ตรวจไฟล์เบื้องต้นฝั่ง client คืนข้อความภาษาไทยถ้าไม่ผ่าน */
export function validateFile(file: File): string | null {
  return validateUploadMetadata(file);
}
