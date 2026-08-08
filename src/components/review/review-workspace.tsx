'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icons';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { AiReviewChat } from '@/components/review/ai-review-chat';
import type { ReviewJob } from '@/constants/enterprise-data';
import { REVIEW_TOPICS } from '@/constants/review-topics';
import {
  getTransition,
  MEDIA_STATUS,
  USER_ROLE,
  type UserRole,
} from '@/constants/workflow';

type ReviewResult = 'PASS' | 'NEEDS_WORK' | null;

const resultButton = (active: boolean, tone: 'pass' | 'revise') =>
  active
    ? tone === 'pass'
      ? 'bg-status-approved text-white'
      : 'bg-status-rejected text-white'
    : tone === 'pass'
      ? 'bg-status-approved/10 text-status-approved'
      : 'bg-status-rejected/10 text-status-rejected';

export function ReviewWorkspace({ job, role }: { job: ReviewJob; role: UserRole }) {
  const isAcademic = role === USER_ROLE.ADMIN;
  const [results, setResults] = useState<Record<string, ReviewResult>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const allTopicsReviewed = REVIEW_TOPICS.every((topic) => results[topic.id] != null);
  const hasIssue = REVIEW_TOPICS.some((topic) => results[topic.id] === 'NEEDS_WORK');
  const readyToForward = allTopicsReviewed && !hasIssue;
  const commentCount = Object.values(comments).filter((comment) => comment.trim()).length;

  const forwardRule = getTransition(MEDIA_STATUS.IN_REVIEW, MEDIA_STATUS.ACADEMIC_REVIEW);
  const revisionRule = getTransition(MEDIA_STATUS.IN_REVIEW, MEDIA_STATUS.REVISION);
  const rejectRule = getTransition(MEDIA_STATUS.IN_REVIEW, MEDIA_STATUS.REJECTED);
  const approveRule = getTransition(MEDIA_STATUS.ACADEMIC_REVIEW, MEDIA_STATUS.APPROVED);
  const minorRevisionRule = getTransition(
    MEDIA_STATUS.ACADEMIC_REVIEW,
    MEDIA_STATUS.ACADEMIC_REVISION,
  );

  const chooseDecision = (message: string) => {
    setNotice(`${message} · โหมดพรีวิวยังไม่เขียนฐานข้อมูล`);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill>
              {isAcademic ? 'ตรวจขั้นสุดท้ายโดยหัวหน้าวิชาการ' : `รอบกลุ่มสาระ: ${job.department}`}
            </Pill>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.035em]">{job.title}</h1>
          <p className="mt-2 text-sm text-ink-faint">
            {job.id} · {job.owner} · {job.subject} · {job.grade}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNotice('บันทึกคอมเมนต์รายหัวข้อเป็นแบบร่างแล้ว · โหมดพรีวิว')}
          className="rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-semibold"
        >
          บันทึกแบบร่างผลตรวจ
        </button>
      </div>

      <div className="grid items-start gap-6 2xl:grid-cols-[1.05fr_1.15fr_.8fr]">
        <SectionCard title="ตัวอย่างไฟล์" description="ไฟล์ private · เปิดผ่าน signed URL เท่านั้น">
          <div className="grid min-h-[520px] place-items-center rounded-xl border border-dashed border-line bg-surface">
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Icon name="file" className="size-7" />
              </span>
              <p className="mt-4 text-sm font-semibold">teaching-media-v{job.version}.pdf</p>
              <p className="mt-1 text-xs text-ink-faint">PDF · 8.4 MB · 24 หน้า</p>
              <button type="button" className="mt-4 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-semibold">
                เปิด Preview
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="ผลตรวจและคอมเมนต์รายหัวข้อ"
          description="ตรวจและเขียนคอมเมนต์ตามหัวข้อที่อาจารย์กรอกในแบบฟอร์ม อาจารย์จะเห็นข้อความแยกตามหัวข้อ"
        >
          <div className="space-y-3">
            {REVIEW_TOPICS.map((topic, index) => (
              <details
                key={topic.id}
                className="rounded-xl border border-line bg-surface/70 p-3"
                open={index === 0}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{topic.title}</p>
                      <p className="mt-1 text-[10px] text-ink-faint">
                        ตรวจข้อมูลที่อาจารย์กรอกในหัวข้อนี้
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          setResults((current) => ({ ...current, [topic.id]: 'PASS' }));
                        }}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold ${resultButton(results[topic.id] === 'PASS', 'pass')}`}
                      >
                        เรียบร้อย
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          setResults((current) => ({ ...current, [topic.id]: 'NEEDS_WORK' }));
                        }}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold ${resultButton(results[topic.id] === 'NEEDS_WORK', 'revise')}`}
                      >
                        ควรแก้
                      </button>
                    </div>
                  </div>
                </summary>
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-[11px] leading-5 text-ink-muted">{topic.description}</p>
                  <textarea
                    rows={3}
                    value={comments[topic.id] ?? ''}
                    onChange={(event) =>
                      setComments((current) => ({ ...current, [topic.id]: event.target.value }))
                    }
                    placeholder={`คอมเมนต์สำหรับหัวข้อ${topic.title} — อาจารย์จะเห็นข้อความนี้ในหัวข้อนี้โดยตรง`}
                    className="mt-3 w-full resize-y rounded-lg border border-line bg-panel p-2.5 text-xs outline-none focus:border-brand"
                  />
                </div>
              </details>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <AiReviewChat
            job={job}
            role={role}
            results={results}
            comments={comments}
            summary={summary}
          />

          <SectionCard title="สรุปและตัดสิน">
            <textarea
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="สรุปผลรวมสำหรับอาจารย์..."
              className="w-full rounded-xl border border-line bg-surface p-3 text-xs outline-none focus:border-brand"
            />
            <p className="mt-2 text-[11px] text-ink-faint">มีคอมเมนต์รายหัวข้อแล้ว {commentCount} ข้อ</p>

            {isAcademic ? (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    chooseDecision(
                      `${approveRule?.label ?? 'อนุมัติผ่าน'} ส่งผลกลับให้อาจารย์เจ้าของสื่อและเผยแพร่เข้าคลังแล้ว`,
                    )
                  }
                  className="w-full rounded-lg bg-status-approved px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  {approveRule?.label ?? 'อนุมัติผ่าน'}
                </button>
                <button
                  type="button"
                  disabled={commentCount === 0}
                  onClick={() =>
                    chooseDecision(
                      `${minorRevisionRule?.label ?? 'ส่งกลับแก้ไขเล็กน้อย'} พร้อมคอมเมนต์รายหัวข้อให้อาจารย์เจ้าของสื่อ`,
                    )
                  }
                  className="w-full rounded-lg bg-status-pending/10 px-3 py-2.5 text-xs font-bold text-status-pending disabled:opacity-40"
                >
                  {minorRevisionRule?.label ?? 'ส่งกลับแก้ไขเล็กน้อย'}
                </button>
                <p className="pt-1 text-[10px] leading-5 text-ink-faint">
                  เมื่ออนุมัติ ระบบจะแจ้งผลผ่านให้อาจารย์เจ้าของสื่อทันที
                  หากส่งกลับแก้ไข อาจารย์จะเห็นคอมเมนต์แยกตามหัวข้อ
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  disabled={!readyToForward}
                  title={
                    readyToForward
                      ? forwardRule?.description
                      : 'ต้องตรวจครบทุกหัวข้อและไม่มีหัวข้อที่ควรแก้ก่อนส่งต่อ'
                  }
                  onClick={() => chooseDecision(forwardRule?.label ?? 'ส่งต่อหัวหน้าวิชาการ')}
                  className="w-full rounded-lg bg-brand px-3 py-2.5 text-xs font-bold text-brand-contrast disabled:opacity-40"
                >
                  {forwardRule?.label ?? 'ส่งต่อหัวหน้าวิชาการ'}
                </button>
                <button
                  type="button"
                  title={revisionRule?.description}
                  onClick={() => {
                    if (commentCount === 0) {
                      setNotice('กรุณาเขียนคอมเมนต์ระบุจุดที่ต้องแก้ไขอย่างน้อย 1 หัวข้อก่อนส่งกลับให้อาจารย์');
                      return;
                    }
                    chooseDecision(
                      `${revisionRule?.label ?? 'ส่งกลับให้อาจารย์แก้ไข'} พร้อมคอมเมนต์รายหัวข้อแล้ว`,
                    );
                  }}
                  className="w-full rounded-lg bg-status-pending px-3 py-2.5 text-xs font-bold text-white"
                >
                  {revisionRule?.label ?? 'ส่งกลับให้อาจารย์แก้ไข'}
                </button>
                <p className="text-center text-[10px] leading-5 text-ink-faint">
                  ต้องเขียนคอมเมนต์ระบุจุดแก้ไขอย่างน้อย 1 หัวข้อ
                </p>
                <button
                  type="button"
                  disabled={!hasIssue || (!summary.trim() && commentCount === 0)}
                  onClick={() => chooseDecision(rejectRule?.label ?? 'ไม่ผ่าน')}
                  className="w-full rounded-lg bg-status-rejected/10 px-2 py-2.5 text-xs font-bold text-status-rejected disabled:opacity-40"
                >
                  {rejectRule?.label ?? 'ไม่ผ่าน'}
                </button>
              </div>
            )}

            {notice && (
              <p className="mt-3 rounded-lg border border-line bg-surface p-3 text-[11px] leading-5 text-ink-muted">
                {notice}
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
