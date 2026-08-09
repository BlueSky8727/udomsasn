// src/app/(teacher)/submit/page.tsx
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { SubmitForm, type SubmitFormInitialMedia } from '@/components/media/submit-form';
import { DEMO_MEDIA } from '@/constants/mock-data';
import { MEDIA_STATUS, USER_ROLE, type MediaStatus } from '@/constants/workflow';
import { getViewerName, getViewerRole } from '@/lib/auth';

export default async function Submit({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; revise?: string }>;
}) {
  const [role, viewer, query] = await Promise.all([
    getViewerRole(),
    getViewerName(),
    searchParams,
  ]);

  if (role !== USER_ROLE.TEACHER) notFound();

  const mediaId = query.draft ?? query.revise;
  const requestedStatuses: readonly MediaStatus[] = query.revise
    ? [MEDIA_STATUS.REVISION, MEDIA_STATUS.ACADEMIC_REVISION]
    : [MEDIA_STATUS.DRAFT];

  // ฝั่งจริงต้องอ่านสื่อจากฐานข้อมูลด้วย owner_id ของ session เท่านั้น
  const source = mediaId
    ? DEMO_MEDIA.find(
        (media) =>
          media.id === mediaId &&
          media.author === viewer &&
          requestedStatuses.includes(media.status),
      )
    : undefined;
  const initialMedia: SubmitFormInitialMedia | undefined = source
    ? {
        id: source.id,
        title: source.title,
        subject: source.subjectGroup,
        grade: source.grade,
        status: source.status,
      }
    : undefined;

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Teacher Workspace"
        title={
          initialMedia
            ? initialMedia.status === MEDIA_STATUS.REVISION ||
              initialMedia.status === MEDIA_STATUS.ACADEMIC_REVISION
              ? 'แก้ไขสื่อที่กลุ่มสาระส่งกลับมา'
              : 'ทำฉบับร่างต่อ'
            : 'สร้างสื่อและส่งให้กลุ่มสาระตรวจ'
        }
        description={
          initialMedia?.status === MEDIA_STATUS.REVISION ||
          initialMedia?.status === MEDIA_STATUS.ACADEMIC_REVISION
            ? 'อ่านข้อเสนอแนะจากหน้ารายละเอียด แก้ไขข้อมูลและแนบไฟล์ฉบับใหม่ก่อนส่งกลับเข้ากระบวนการตรวจ'
            : 'เลือกกลุ่มสาระปลายทาง บันทึกเป็นฉบับร่างไว้ก่อนได้ แล้วจึงส่งเข้าสู่กระบวนการตรวจเมื่อข้อมูลพร้อม'
        }
      />
      <SubmitForm initialMedia={initialMedia} />
    </AppShell>
  );
}
