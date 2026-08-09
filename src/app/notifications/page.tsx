// src/app/notifications/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { getViewerRole } from '@/lib/auth';

export default async function Notifications() {
  const role = await getViewerRole();

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Notification Center"
        title="การแจ้งเตือน"
        description="กดรายการเพื่อเปิดสื่อหรืองานตรวจที่เกี่ยวข้อง และติดตามเฉพาะรายการที่ยังไม่ได้อ่าน"
      />
      <NotificationCenter role={role} />
    </AppShell>
  );
}
