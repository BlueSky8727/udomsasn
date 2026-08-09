import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-6 text-ink">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">ไม่พบข้อมูล</p>
        <h1 className="mt-3 text-2xl font-bold">หน้านี้ไม่มีอยู่หรือคุณไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          ระบบไม่เปิดเผยรายละเอียดของรายการที่อยู่นอกขอบเขตงานของบัญชีคุณ
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-strong"
        >
          กลับหน้าภาพรวม
        </Link>
      </div>
    </main>
  );
}
