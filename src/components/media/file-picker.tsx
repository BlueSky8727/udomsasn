'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icons';
import {
  ACCEPT_ATTRIBUTE,
  FILE_KIND_LABELS,
  fileKindOf,
  formatBytes,
  isPreviewable,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  MAX_TOTAL_UPLOAD_BYTES,
  validateFile,
} from '@/constants/upload';

/**
 * ตัวเลือกไฟล์: กดเปิดหน้าต่างเลือกไฟล์ หรือลากไฟล์มาวางก็ได้
 *
 * ตัวเลือกไฟล์ถือไฟล์ไว้ในหน่วยความจำของเบราว์เซอร์เท่านั้น การอัปโหลดจริงเกิดตอนกดบันทึก/ส่ง
 * ในฟอร์ม (`submit-form.tsx`) ซึ่งส่ง multipart ผ่าน `/api/backend/media` ไปเก็บที่ NestJS
 * การตรวจชนิดไฟล์ที่นี่เป็นแค่การช่วยผู้ใช้ ฝั่งเซิร์ฟเวอร์ตรวจซ้ำเสมอ (กฎเหล็กข้อ 2)
 * และการส่งใหม่ทุกครั้งต้องเป็น media_version ใหม่ ห้ามทับไฟล์เดิม (กฎเหล็กข้อ 4)
 */

type FilePickerProps = {
  files: readonly File[];
  onChange: (files: File[]) => void;
};

const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export function FilePicker({ files, onChange }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  // เก็บ blob URL ที่สร้างไว้ เพื่อคืนหน่วยความจำตอนออกจากหน้า
  const previewUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const accepted: File[] = [];
    const errors: string[] = [];
    const existingBytes = files.reduce((total, file) => total + file.size, 0);
    let acceptedBytes = 0;

    for (const file of Array.from(incoming)) {
      if (files.length + accepted.length >= MAX_UPLOAD_FILES) {
        errors.push(`เพิ่มได้ไม่เกิน ${MAX_UPLOAD_FILES} ไฟล์ต่อสื่อหนึ่งรายการ`);
        break;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name} — ${error}`);
        continue;
      }
      const duplicate =
        files.some((existing) => sameFile(existing, file)) ||
        accepted.some((existing) => sameFile(existing, file));
      if (duplicate) {
        errors.push(`${file.name} — เลือกไฟล์นี้ไว้แล้ว`);
        continue;
      }
      if (existingBytes + acceptedBytes + file.size > MAX_TOTAL_UPLOAD_BYTES) {
        errors.push(
          `${file.name} — ขนาดไฟล์รวมเกิน ${formatBytes(MAX_TOTAL_UPLOAD_BYTES)}`,
        );
        continue;
      }
      accepted.push(file);
      acceptedBytes += file.size;
    }

    setRejected(errors);
    if (accepted.length > 0) onChange([...files, ...accepted]);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    previewUrls.current.push(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`w-full rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
          dragging ? 'border-brand bg-brand/8' : 'border-brand/25 bg-brand/[0.03] hover:bg-brand/8'
        }`}
      >
        <Icon name="cloudUpload" className="mx-auto size-8 text-brand" />

        <p className="mt-3 text-sm font-medium text-ink">คลิกหรือลากไฟล์มาวางที่นี่</p>

        <p className="mt-1.5 text-xs leading-5 text-ink-faint">
          รองรับไฟล์รูปภาพ PDF วิดีโอ และไฟล์เอกสาร
          <br />
          ไม่เกิน {formatBytes(MAX_UPLOAD_BYTES)} ต่อไฟล์ · สูงสุด {MAX_UPLOAD_FILES} ไฟล์
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          // เคลียร์ค่า เพื่อให้เลือกไฟล์เดิมซ้ำแล้ว event ยังยิง
          e.target.value = '';
        }}
      />

      {rejected.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-status-rejected/30 bg-status-rejected/8 p-3 text-xs text-status-rejected">
          {rejected.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-[11px] text-ink-faint">
                {FILE_KIND_LABELS[fileKindOf(file.name)]}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{file.name}</span>
                <span className="block text-xs text-ink-faint">{formatBytes(file.size)}</span>
              </span>

              {isPreviewable(file) && (
                <button
                  type="button"
                  onClick={() => openPreview(file)}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-brand transition-colors hover:bg-panel-hover"
                >
                  เปิดดู
                </button>
              )}

              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`ลบ ${file.name}`}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-ink-faint transition-colors hover:bg-panel-hover hover:text-status-rejected"
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
