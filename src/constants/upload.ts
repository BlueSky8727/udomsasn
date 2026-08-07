/**
 * upload.ts — กติกาของไฟล์ที่รับได้
 *
 * ค่าที่นี่ใช้กับฝั่ง client เพื่อบอกผู้ใช้ตั้งแต่ตอนเลือกไฟล์
 * **แต่ยังไม่ใช่การป้องกัน** ฝั่งเซิร์ฟเวอร์ต้องตรวจซ้ำทุกครั้ง (กฎเหล็กข้อ 2)
 * ของจริงให้เซิร์ฟเวอร์อ่านเพดานขนาดจาก MAX_UPLOAD_BYTES ใน env
 */

/** เพดานขนาดต่อไฟล์ ค่าเริ่มต้น 50MB (ตรงกับ .env.example) */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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

/** ตรวจไฟล์เบื้องต้นฝั่ง client คืนข้อความภาษาไทยถ้าไม่ผ่าน */
export function validateFile(file: File): string | null {
  const ext = `.${extensionOf(file.name)}`;
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `ไม่รองรับไฟล์นามสกุล ${ext}`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `ไฟล์ใหญ่เกิน ${formatBytes(MAX_UPLOAD_BYTES)}`;
  }
  if (file.size === 0) {
    return 'ไฟล์ว่าง';
  }
  return null;
}
