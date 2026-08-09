// src/components/review/queue-table.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Pill, TimeBadge } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import type { ReviewJob } from '@/constants/enterprise-data';
import { MEDIA_STATUS, STATUS_LABELS } from '@/constants/workflow';

/**
 * ตารางคิวตรวจพร้อมตัวกรอง
 *
 * กรองในเบราว์เซอร์จากรายการที่เซิร์ฟเวอร์ส่งมาแล้ว ตัวกรองนี้เป็นเรื่องการแสดงผลล้วน ๆ
 * ไม่ใช่การจำกัดสิทธิ์ — ใครเห็นงานไหนได้บ้างต้องคัดฝั่งเซิร์ฟเวอร์ก่อนส่งมา (กฎเหล็กข้อ 2)
 *
 * เมื่อย้ายไปใช้ข้อมูลจริงและคิวยาวขึ้น ให้เปลี่ยนไปกรองด้วย query ฝั่งเซิร์ฟเวอร์
 */

type QueueFilter = {
  id: string;
  label: string;
  match: (job: ReviewJob) => boolean;
};

/** กรองตามสถานะของงานอย่างเดียว คิวนี้ตอบคำถามว่า "ตอนนี้ต้องทำอะไรต่อ" */
const FILTERS: readonly QueueFilter[] = [
  { id: 'all', label: 'ทั้งหมด', match: () => true },
  {
    id: 'sent-revision',
    label: 'ส่งแก้',
    match: (job) =>
      job.status === MEDIA_STATUS.REVISION ||
      job.status === MEDIA_STATUS.ACADEMIC_REVISION,
  },
];

const FALLBACK_FILTER = FILTERS[0]!;

export function QueueTable({ jobs }: { jobs: readonly ReviewJob[] }) {
  const [activeId, setActiveId] = useState(FALLBACK_FILTER.id);

  const counts = useMemo(
    () => new Map(FILTERS.map((filter) => [filter.id, jobs.filter(filter.match).length])),
    [jobs],
  );

  const rows = useMemo(() => {
    const active = FILTERS.find((filter) => filter.id === activeId) ?? FALLBACK_FILTER;
    return jobs.filter(active.match);
  }, [jobs, activeId]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.id === activeId;
          const count = counts.get(filter.id) ?? 0;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveId(filter.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                active
                  ? 'bg-brand font-semibold text-brand-contrast'
                  : 'border border-line bg-surface text-ink-muted hover:border-brand/30 hover:text-ink'
              }`}
            >
              {filter.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-brand-contrast/20' : 'bg-panel text-ink-faint'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase text-ink-faint">
            <tr>
              <th className="pb-3">สื่อ</th>
              <th>ผู้ส่ง</th>
              <th>สถานะ</th>
              <th>อายุคิว</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-xs text-ink-faint">
                  ไม่มีงานในกลุ่มนี้
                </td>
              </tr>
            ) : (
              rows.map((job) => (
                <tr key={job.id} className="border-b border-line/70 last:border-0">
                  <td className="py-4">
                    <p className="font-semibold">{job.title}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {job.id} · {job.subject} · {job.grade} · v{job.version}
                    </p>
                  </td>
                  <td className="text-xs text-ink-muted">{job.owner}</td>
                  <td>
                    <Pill>{STATUS_LABELS[job.status]}</Pill>
                  </td>
                  <td>
                    <TimeBadge>{job.age}</TimeBadge>
                  </td>
                  <td>
                    <Link
                      href={`/review/${job.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand"
                    >
                      เปิดตรวจ <Icon name="chevronRight" className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
