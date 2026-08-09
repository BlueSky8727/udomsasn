'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6 text-ink">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-status-rejected">
          เกิดข้อผิดพลาด
        </p>
        <h1 className="mt-3 text-2xl font-bold">ระบบยังเปิดหน้านี้ไม่ได้</h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          กรุณาลองอีกครั้ง หากยังพบปัญหาให้แจ้งผู้ดูแลระบบพร้อมเวลาที่เกิดเหตุ
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-ink-faint">รหัสอ้างอิง: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-strong"
        >
          ลองอีกครั้ง
        </button>
      </div>
    </main>
  );
}
