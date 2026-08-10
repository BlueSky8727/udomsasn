import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { getViewerRole } from '@/lib/auth';
import { backendFetch } from '@/lib/backend';
import type { BackendNotification } from '@/types/backend';

export default async function NotificationsPage() {
  const role = await getViewerRole();
  let notifications: BackendNotification[] = [];
  try { notifications = await backendFetch<BackendNotification[]>('/notifications'); } catch { notifications = []; }
  return <AppShell role={role}><PageHeading eyebrow="Notification Center" title="การแจ้งเตือน" description="สถานะอ่านแล้วถูกบันทึกลงฐานข้อมูลและซิงก์ทุกอุปกรณ์"/><NotificationCenter initialNotifications={notifications}/></AppShell>;
}
