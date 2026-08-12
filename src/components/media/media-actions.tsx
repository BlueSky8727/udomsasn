'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MEDIA_STATUS, type MediaStatus } from '@/constants/workflow';

export function MediaActions({ id, status }: { id: string; status: MediaStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = new Set<MediaStatus>([
    MEDIA_STATUS.DRAFT,
    MEDIA_STATUS.REVISION,
    MEDIA_STATUS.ACADEMIC_REVISION,
    MEDIA_STATUS.ARCHIVED,
  ]).has(status);
  const query = status === MEDIA_STATUS.DRAFT ? `draft=${id}` : `revise=${id}`;

  const remove = async () => {
    if (!window.confirm('ยืนยันลบฉบับร่างนี้ถาวร?')) return;
    setBusy(true);
    const response = await fetch(`/api/backend/media/${id}`, { method: 'DELETE' });
    if (response.ok) {
      router.replace('/my-media');
      router.refresh();
      return;
    }
    const data = (await response.json()) as { message?: string };
    setError(data.message ?? 'ลบฉบับร่างไม่สำเร็จ');
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {editable && <Link href={`/submit?${query}`} className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-contrast">แก้ไขสื่อ</Link>}
      {status === MEDIA_STATUS.DRAFT && <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-lg border border-status-rejected/30 px-4 py-2 text-xs font-semibold text-status-rejected disabled:opacity-50">ลบฉบับร่าง</button>}
      {error && <p className="w-full text-xs text-status-rejected">{error}</p>}
    </div>
  );
}
