// src/app/browse/page.tsx
import { AppShell } from '@/components/ui/app-shell';
import { MediaBrowser } from '@/components/library/media-browser';
import { PageHeading } from '@/components/ui/page-heading';
import { DEMO_MEDIA } from '@/constants/mock-data';
import { MEDIA_STATUS } from '@/constants/workflow';
import { getViewerRole } from '@/lib/auth';

export default async function BrowsePage() {
  const role = await getViewerRole();

  // คัดเฉพาะ APPROVED ที่นี่ก่อนส่งต่อ สื่อสถานะอื่นต้องไม่หลุดไปถึงเบราว์เซอร์
  // แม้จะไม่ได้แสดงผลก็ตาม เพราะ props ของ client component ติดไปกับ HTML ด้วย
  const approved = DEMO_MEDIA.filter((item) => item.status === MEDIA_STATUS.APPROVED);

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Media Library"
        title="ค้นหาสื่อการสอน"
        description="ค้นหาสื่อที่ผ่านการตรวจอนุมัติแล้ว พร้อมกรองตามวิชาและระดับชั้น"
      />
      <MediaBrowser media={approved} />
    </AppShell>
  );
}
