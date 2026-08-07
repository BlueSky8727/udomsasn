'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ACCEPT_ATTRIBUTE,
  FILE_KIND_LABELS,
  fileKindOf,
  formatBytes,
  isPreviewable,
  MAX_UPLOAD_BYTES,
  validateFile,
} from '@/constants/upload';

/**
 * ตัวเลือกไฟล์: กดเปิดหน้าต่างเลือกไฟล์ หรือลากไฟล์มาวางก็ได้
 *
 * ตอนนี้ยังเก็บไฟล์ไว้ในหน่วยความจำของเบราว์เซอร์เท่านั้น ยังไม่ได้ส่งขึ้น storage
 * เมื่อต่อ Supabase แล้วให้ส่งไฟล์เข้า private bucket (กฎเหล็กข้อ 6)
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

    for (const file of Array.from(incoming)) {
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
      accepted.push(file);
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
      <div
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
        className={`rounded-xl border border-dashed p-6 text-center transition-colors ${
          dragging ? 'border-brand bg-brand/5' : 'border-line bg-panel/50'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto size-8 text-ink-faint"
          aria-hidden
        >
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
        </svg>

        <p className="mt-3 text-sm text-ink-muted">ลากไฟล์มาวางที่นี่ หรือ</p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium transition-colors hover:bg-panel-hover"
        >
          เลือกไฟล์จากเครื่อง
        </button>

        <p className="mt-3 text-xs text-ink-faint">
          รองรับ PDF สไลด์ เอกสาร รูปภาพ วิดีโอ เสียง · ไม่เกิน{' '}
          {formatBytes(MAX_UPLOAD_BYTES)} ต่อไฟล์
        </p>

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
      </div>

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
            <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-3 px-4 py-3">
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
