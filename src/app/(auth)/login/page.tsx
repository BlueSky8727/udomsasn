// src/app/(auth)/login/page.tsx
import Link from 'next/link';
import { AuthPanel } from '@/components/auth/auth-panel';
import { Icon } from '@/components/ui/icons';
import { SchoolLogo } from '@/components/ui/school-logo';

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-surface pt-9">
      <div className="fixed inset-x-0 top-0 z-20 flex h-9 items-center bg-gradient-to-r from-coral-strong to-coral px-5 text-[11px] text-white sm:px-8">
        <span className="flex items-center gap-2 font-medium">
          <span className="size-2 rounded-full bg-emerald-300" />
          ระบบออนไลน์
        </span>
        <span className="ml-auto hidden sm:block">โทร. 073-288102</span>
      </div>

      <div className="grid min-h-[calc(100vh-2.25rem)] lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-deep p-12 text-white lg:sticky lg:top-9 lg:flex lg:h-[calc(100vh-2.25rem)] lg:flex-col lg:justify-between">
        <div className="school-pattern pointer-events-none absolute inset-0 opacity-45" />
        <div className="absolute -left-24 top-1/3 size-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-y-0 right-0 w-2 bg-coral" />
        <Link href="/" className="relative flex items-center gap-4">
          <SchoolLogo className="size-20 border-2 border-white/30 shadow-xl shadow-black/20" />
          <div>
            <p className="text-xl font-bold">Udomsasn Media QA</p>
            <p className="mt-1 text-xs text-white/60">ระบบคลังและตรวจสื่อการสอน</p>
          </div>
        </Link>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80">
            <Icon name="shield" className="size-3.5" />
            ระบบภายในโรงเรียนอุดมศาสน์วิทยา
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.045em] xl:text-5xl">
            สื่อคุณภาพ เริ่มจาก
            <br />
            กระบวนการที่ชัดเจน
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/68">
            พื้นที่กลางสำหรับอาจารย์ ผู้ตรวจ และผู้ดูแลระบบ ตั้งแต่การส่งสื่อ ตรวจคุณภาพ
            ไปจนถึงการเผยแพร่ให้พร้อมใช้ในชั้นเรียน
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
            {[
              ['1', 'ตรวจโดยหัวหน้ากลุ่มสาระ'],
              ['2', 'อนุมัติโดยหัวหน้าวิชาการ'],
            ].map(([step, label]) => (
              <div key={step} className="rounded-lg border border-white/12 bg-white/8 p-4">
                <span className="grid size-7 place-items-center rounded-full bg-coral text-xs font-bold">{step}</span>
                <p className="mt-3 text-xs font-medium text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/50">
          Udomsasn Media QA · Academic Year 2569
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:py-14">
        <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-xl shadow-navy/5 sm:p-9">
          <div className="mb-8 border-b border-line pb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <SchoolLogo className="size-14" />
              <div>
                <strong className="block text-navy dark:text-white">Udomsasn Media QA</strong>
                <span className="text-[11px] text-ink-faint">ระบบคลังและตรวจสื่อการสอน</span>
              </div>
            </Link>
          </div>
          <AuthPanel />
        </div>
      </section>
      </div>
    </main>
  );
}
