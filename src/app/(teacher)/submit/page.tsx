import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { SubmitForm, type SubmitFormInitialMedia } from '@/components/media/submit-form';
import { MEDIA_STATUS, USER_ROLE, type MediaStatus } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { requireViewer } from '@/lib/auth';
import type { BackendMedia } from '@/types/backend';

async function editableMedia(id: string): Promise<BackendMedia | null> {
  try { return await backendFetch<BackendMedia>(`/media/${id}`); } catch { return null; }
}

export default async function Submit({ searchParams }: { searchParams: Promise<{ draft?: string; revise?: string }> }) {
  const [viewer, query] = await Promise.all([requireViewer(), searchParams]);
  if (viewer.role !== USER_ROLE.TEACHER) redirect('/forbidden');
  const mediaId = query.draft ?? query.revise;
  const requestedStatuses: readonly MediaStatus[] = query.revise
    ? [MEDIA_STATUS.REVISION, MEDIA_STATUS.ACADEMIC_REVISION]
    : [MEDIA_STATUS.DRAFT];
  const source = mediaId ? await editableMedia(mediaId) : null;
  if (mediaId && (!source || source.ownerId !== viewer.id || !requestedStatuses.includes(source.status))) notFound();
  const initialMedia: SubmitFormInitialMedia | undefined = source ? {
    id: source.id,
    title: source.title,
    subject: source.subjectGroup,
    grade: source.gradeLevel,
    status: source.status,
    description: source.description,
    learningProcess: source.learningProcess ?? '',
    attachmentNote: source.attachmentNote ?? '',
    mediaType: source.mediaType,
    existingFileCount: source.files.length,
  } : undefined;
  const revising = initialMedia?.status === MEDIA_STATUS.REVISION || initialMedia?.status === MEDIA_STATUS.ACADEMIC_REVISION;
  return (
    <AppShell role={viewer.role}>
      <PageHeading
        eyebrow="Teacher Workspace"
        title={initialMedia ? (revising ? 'แก้ไขสื่อที่ส่งกลับมา' : 'ทำฉบับร่างต่อ') : 'สร้างสื่อและส่งให้กลุ่มสาระตรวจ'}
        description={revising
          ? 'แก้ไขข้อมูลและแนบไฟล์ฉบับใหม่ก่อนส่งกลับเข้ากระบวนการตรวจ'
          : 'บันทึกเป็นฉบับร่างไว้ก่อนได้ แล้วส่งเข้ากระบวนการตรวจเมื่อข้อมูลพร้อม'}
      />
      <SubmitForm initialMedia={initialMedia} viewerName={viewer.name} />
    </AppShell>
  );
}
