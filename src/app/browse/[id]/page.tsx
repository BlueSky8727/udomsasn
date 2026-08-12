import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { PageHeading } from '@/components/ui/page-heading';
import { MEDIA_STATUS, STATUS_LABELS } from '@/constants/workflow';
import { backendFetch } from '@/lib/backend';
import { getViewerRole } from '@/lib/auth';
import type { BackendMedia } from '@/types/backend';

async function load(id: string) {
  try {
    return await backendFetch<BackendMedia>(`/media/${id}`);
  } catch {
    return null;
  }
}

const fileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default async function BrowseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, media] = await Promise.all([getViewerRole(), load(id)]);
  if (!media || media.status !== MEDIA_STATUS.APPROVED) notFound();

  // คลังสื่อให้หยิบไปใช้ จึงเสนอเฉพาะไฟล์ของฉบับที่ผ่านการอนุมัติ ไม่ใช่ไฟล์ร่างรอบก่อน
  const currentFiles = media.files.filter((file) => file.version === media.version);
  const files = currentFiles.length > 0 ? currentFiles : media.files;

  return (
    <AppShell role={role}>
      <Link href="/browse" className="text-xs font-semibold text-brand">
        ← กลับคลังสื่อ
      </Link>
      <PageHeading
        eyebrow={media.code}
        title={media.title}
        description={`${media.subject} · ${media.gradeLevel} · โดย ${media.owner.name}`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <SectionCard title="รายละเอียดสื่อ">
          <div className="flex flex-wrap gap-2">
            <Pill tone="ok">{STATUS_LABELS[media.status]}</Pill>
            {media.tags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink-muted">{media.description}</p>
          {media.learningProcess && (
            <div className="mt-5">
              <h3 className="text-sm font-bold">กระบวนการเรียนรู้</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-muted">
                {media.learningProcess}
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="ไฟล์สำหรับนำไปใช้" description={`ฉบับที่อนุมัติ · รอบที่ ${media.version}`}>
          <div className="space-y-2">
            {files.map((file) => (
              <a
                key={file.id}
                href={`/api/backend/media/${media.id}/files/${file.id}/download`}
                className="block rounded-xl border border-line bg-surface p-3 text-xs font-semibold text-brand transition-colors hover:border-brand/40"
              >
                ดาวน์โหลด {file.name}
                <span className="mt-1 block font-normal text-ink-faint">{fileSize(file.size)}</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-faint">มีผู้นำไปใช้ {media.downloadCount} คน</p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
