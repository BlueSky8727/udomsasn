import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/app-shell';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { PageHeading } from '@/components/ui/page-heading';
import { DEMO_MEDIA, type DemoFeedback } from '@/constants/mock-data';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerName, getViewerRole } from '@/lib/auth';

const FEEDBACK_LABEL: Record<DemoFeedback['decision'], string> = {
  REVISION: 'ให้แก้ไข',
  MINOR_REVISION: 'ข้อเสนอแนะ',
  REJECTED: 'ไม่ผ่าน',
  APPROVED: 'ผ่านแล้ว',
};

const feedbackTone = (decision: DemoFeedback['decision']) =>
  decision === 'REJECTED' ? ('danger' as const) : ('warn' as const);

export default async function FeedbackPage() {
  const [role, viewer] = await Promise.all([getViewerRole(), getViewerName()]);

  if (role !== USER_ROLE.TEACHER) notFound();

  const feedbackItems = DEMO_MEDIA.filter(
    (media) =>
      media.author === viewer &&
      media.feedback?.fromRole === 'SUBJECT_HEAD' &&
      media.feedback.decision !== 'APPROVED',
  );

  return (
    <AppShell role={role}>
      <PageHeading
        eyebrow="Teacher Feedback"
        title="ผลจากหัวหน้ากลุ่มสาระ"
        description="รวมเฉพาะสื่อที่หัวหน้ากลุ่มสาระส่งความเห็นกลับมา ให้แก้ไข หรือแจ้งว่าไม่ผ่าน"
      />

      <SectionCard
        title={`รายการที่ต้องตรวจสอบ ${feedbackItems.length} รายการ`}
        description="เปิดแต่ละรายการเพื่ออ่านรายละเอียดและแก้ไขสื่อก่อนส่งตรวจอีกครั้ง"
      >
        {feedbackItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
            <Icon name="message" className="mx-auto size-7 text-ink-faint" />
            <p className="mt-3 text-sm font-semibold">ยังไม่มีผลจากหัวหน้ากลุ่มสาระ</p>
            <p className="mt-1 text-xs text-ink-faint">เมื่อมีผลตรวจหรือข้อความส่งกลับ รายการจะแสดงที่หน้านี้</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {feedbackItems.map((media) => {
              const feedback = media.feedback!;
              return (
                <Link
                  key={media.id}
                  href={`/my-media/${media.id}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-surface/60 p-5 transition hover:border-brand/30 hover:bg-panel-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6">{media.title}</p>
                      <p className="mt-1 text-[11px] font-semibold text-brand">จาก {feedback.from}</p>
                    </div>
                    <Pill tone={feedbackTone(feedback.decision)}>
                      {FEEDBACK_LABEL[feedback.decision]}
                    </Pill>
                  </div>

                  <p className="mt-4 flex-1 text-xs leading-6 text-ink-muted">{feedback.message}</p>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                    <span className="text-[11px] text-ink-faint">{feedback.at}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      เปิดรายละเอียด
                      <Icon
                        name="chevronRight"
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
