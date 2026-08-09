export default function Loading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-surface px-6 text-ink"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 text-center shadow-sm">
        <span className="mx-auto block size-9 animate-pulse rounded-full bg-brand/20" />
        <p className="mt-4 text-sm font-semibold">กำลังเตรียมข้อมูล</p>
        <p className="mt-1 text-xs text-ink-muted">กรุณารอสักครู่...</p>
      </div>
    </main>
  );
}
