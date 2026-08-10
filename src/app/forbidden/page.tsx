import Link from 'next/link';
import { AppShell } from '@/components/ui/app-shell';
import { Icon } from '@/components/ui/icons';
import { getViewerRole } from '@/lib/auth';

export default async function ForbiddenPage() {
  const role = await getViewerRole();
  return (
    <AppShell role={role}>
      <div className="grid min-h-[65vh] place-items-center text-center">
        <div className="max-w-md rounded-2xl border border-line bg-panel p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-status-rejected/10 text-status-rejected"><Icon name="shield" className="size-6" /></span>
          <h1 className="mt-5 text-2xl font-bold">ไม่มีสิทธิ์เปิดหน้านี้</h1>
          <p className="mt-2 text-sm leading-7 text-ink-muted">บัญชีของคุณไม่ได้รับตำแหน่งสำหรับหน้านี้ หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อหัวหน้าวิชาการ</p>
          <Link href="/" className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast">กลับหน้าหลัก</Link>
        </div>
      </div>
    </AppShell>
  );
}
