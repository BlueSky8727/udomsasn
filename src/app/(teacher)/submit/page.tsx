// src/app/(teacher)/submit/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { SubmitForm } from '@/components/media/submit-form';
import { getViewerRole } from '@/lib/auth';

export default async function Submit() {
  const role = await getViewerRole();
  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="New Submission"
        title="ส่งสื่อเข้าสู่กระบวนการตรวจ"
        description="ระบบจะเก็บเป็นร่างก่อนเสมอ และสร้างเวอร์ชันใหม่เมื่อมีการส่งฉบับแก้ไข"
      />
      <SubmitForm />
    </AppShell>
  );
}
