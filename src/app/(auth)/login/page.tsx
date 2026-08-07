// src/app/(auth)/login/page.tsx
import Link from 'next/link';
import { Icon } from '@/components/ui/icons';

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-surface lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-gradient-to-br from-brand/16 via-panel to-surface p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-1/3 size-80 rounded-full bg-brand/8 blur-3xl" />
        <div className="absolute -right-20 -top-20 size-72 rounded-full border border-brand/10" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand text-brand-contrast shadow-xl shadow-brand/20">
            <Icon name="sparkles" className="size-5" />
          </span>
          <div>
            <p className="font-bold">Udomsasn Media</p>
            <p className="text-xs text-ink-faint">Teaching Library</p>
          </div>
        </Link>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand">
            <Icon name="shield" className="size-3.5" />
            Internal Learning Platform
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.045em] xl:text-5xl">
            สื่อคุณภาพ เริ่มจาก
            <br />
            กระบวนการที่ดี
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-ink-muted">
            พื้นที่กลางสำหรับอาจารย์ ผู้ตรวจ และผู้ดูแลระบบ ตั้งแต่การส่งสื่อ ตรวจคุณภาพ
            ไปจนถึงการเผยแพร่ให้พร้อมใช้ในชั้นเรียน
          </p>
        </div>
        <p className="relative text-xs text-ink-faint">
          Udomsasn Media Library · Academic Year 2569
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-brand text-brand-contrast">
                <Icon name="sparkles" className="size-5" />
              </span>
              <strong>Udomsasn Media</strong>
            </Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-ink-muted">
            ใช้บัญชีของหน่วยงานเพื่อเข้าใช้งานคลังสื่อการสอน
          </p>
          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold">อีเมล</span>
              <input
                type="email"
                placeholder="name@udomsasn.ac.th"
                className="mt-2 h-12 w-full rounded-xl border border-line bg-panel px-4 text-sm outline-none transition focus:border-brand/45 focus:ring-4 focus:ring-brand/5"
              />
            </label>
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">รหัสผ่าน</span>
                <button type="button" className="text-xs font-medium text-brand">
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 h-12 w-full rounded-xl border border-line bg-panel px-4 text-sm outline-none transition focus:border-brand/45 focus:ring-4 focus:ring-brand/5"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" className="size-4 accent-[var(--brand)]" />
              จดจำการเข้าสู่ระบบบนอุปกรณ์นี้
            </label>
            <Link
              href="/"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong"
            >
              เข้าสู่ระบบ
            </Link>
          </form>
          <div className="mt-7 rounded-xl border border-line bg-panel p-4">
            <p className="text-xs leading-5 text-ink-faint">
              หน้านี้เป็น UI preview ระบบยืนยันตัวตนจริงจะเชื่อมกับ Supabase Auth และตรวจบทบาทจาก
              profile ฝั่งเซิร์ฟเวอร์
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
