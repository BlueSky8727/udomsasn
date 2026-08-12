// src/components/library/media-browser.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/ui/icons';
import { MediaCard } from './media-card';
import { StatusBadge } from '@/components/media/status-badge';
import { GRADE_LEVELS, SUBJECTS } from '@/constants/media-options';
import type { MediaListItem } from '@/types/media-view';

/**
 * แถบค้นหาและตัวกรองของหน้าคลังสื่อ
 *
 * กรองในเบราว์เซอร์จากรายการที่ฝั่งเซิร์ฟเวอร์ส่งมาแล้วเท่านั้น
 * หน้าที่คัดเฉพาะ APPROVED เป็นของ server component เสมอ (กฎเหล็กข้อ 2)
 * คอมโพเนนต์นี้ต้องไม่ไปดึงสื่อสถานะอื่นมาเพิ่มเองไม่ว่ากรณีใด
 *
 * เมื่อย้ายไปใช้ข้อมูลจริง ให้เปลี่ยนตัวกรองเป็น query ฝั่งเซิร์ฟเวอร์
 * แล้วคงรูปหน้าตาเดิมไว้ ตัวเลือกในเมนูสร้างจากข้อมูลที่มีจริง จึงไม่มีตัวเลือกที่กรองแล้วว่าง
 */

type FacetKey = 'subject' | 'grade';

type Facet = {
  key: FacetKey;
  label: string;
  icon: IconName;
  /** ลำดับที่อยากให้แสดงในเมนู ค่าที่ไม่อยู่ในรายการนี้ต่อท้ายแบบเรียงตัวอักษร */
  order: readonly string[];
};

const FACETS: readonly Facet[] = [
  { key: 'subject', label: 'วิชา', icon: 'filter', order: SUBJECTS },
  { key: 'grade', label: 'ระดับชั้น', icon: 'layers', order: GRADE_LEVELS },
];

type Selection = Record<FacetKey, readonly string[]>;

const EMPTY_SELECTION: Selection = { subject: [], grade: [] };

/**
 * ข้อความทุกช่องที่ให้ค้นหาเจอ รวมเป็นก้อนเดียวเพื่อเทียบทีละคำ
 * ประเภทสื่อไม่มีปุ่มกรองแล้ว แต่ยังค้นเจอจากช่องนี้และยังแสดงในมุมมองรายการ
 */
export function MediaBrowser({
  media,
  initialQuery = '',
  initialSelection = EMPTY_SELECTION,
  facetOptions,
  total,
  page,
  totalPages,
}: {
  media: readonly MediaListItem[];
  initialQuery?: string;
  initialSelection?: Selection;
  facetOptions: Record<FacetKey, readonly string[]>;
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const options = useMemo(() => {
    const build = ({ key, order }: Facet) => {
      const present = new Set(facetOptions[key]);
      const known = order.filter((value) => present.has(value));
      const rest = [...present].filter((value) => !order.includes(value)).sort();
      return [...known, ...rest];
    };
    const result = {} as Record<FacetKey, readonly string[]>;
    for (const facet of FACETS) result[facet.key] = build(facet);
    return result;
  }, [facetOptions]);

  const results = media;

  const pickedCount = FACETS.reduce((sum, facet) => sum + selection[facet.key].length, 0);
  const isFiltered = pickedCount > 0 || query.trim().length > 0;

  const toggleValue = (key: FacetKey, value: string) => {
    setSelection((current) => {
      const picked = current[key];
      const next = {
        ...current,
        [key]: picked.includes(value)
          ? picked.filter((item) => item !== value)
          : [...picked, value],
      };
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (next.subject.length) params.set('subject', next.subject.join(','));
      if (next.grade.length) params.set('grade', next.grade.join(','));
      router.push(`/browse${params.size ? `?${params}` : ''}`);
      return next;
    });
  };

  const clearAll = () => {
    setQuery('');
    setSelection(EMPTY_SELECTION);
    router.push('/browse');
  };

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selection.subject.length) params.set('subject', selection.subject.join(','));
    if (selection.grade.length) params.set('grade', selection.grade.join(','));
    if (targetPage > 1) params.set('page', String(targetPage));
    return `/browse${params.size ? `?${params}` : ''}`;
  };

  return (
    <>
      <section className="rounded-2xl border border-line/80 bg-panel p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form action="/browse" method="get" className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              name="q"
              aria-label="ค้นหาสื่อการสอน"
              placeholder="ค้นหาชื่อสื่อ เนื้อหา ผู้สอน หรือแท็ก..."
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-sm outline-none transition focus:border-brand/40 focus:ring-4 focus:ring-brand/5"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  const params = new URLSearchParams();
                  if (selection.subject.length) params.set('subject', selection.subject.join(','));
                  if (selection.grade.length) params.set('grade', selection.grade.join(','));
                  router.push(`/browse${params.size ? `?${params}` : ''}`);
                }}
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-faint transition-colors hover:bg-panel hover:text-ink"
              >
                <Icon name="x" className="size-3.5" />
              </button>
            )}
            {selection.subject.length > 0 && <input type="hidden" name="subject" value={selection.subject.join(',')} />}
            {selection.grade.length > 0 && <input type="hidden" name="grade" value={selection.grade.join(',')} />}
          </form>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {FACETS.map((facet) => (
              <FacetDropdown
                key={facet.key}
                label={facet.label}
                icon={facet.icon}
                options={options[facet.key]}
                selected={selection[facet.key]}
                onToggle={(value) => toggleValue(facet.key, value)}
                onClear={() => setSelection((current) => ({ ...current, [facet.key]: [] }))}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
          <p className="text-xs text-ink-faint">
            พบ <strong className="text-ink">{total}</strong> รายการ
            {isFiltered ? ' ตามเงื่อนไขที่เลือก' : 'ที่พร้อมใช้งาน'}
            {isFiltered && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-2 rounded-md px-1.5 py-0.5 font-semibold text-brand transition-colors hover:bg-brand/10"
              >
                ล้างตัวกรอง
              </button>
            )}
          </p>
          <div className="flex rounded-lg border border-line bg-surface p-1">
            <ViewButton
              icon="grid"
              label="แสดงแบบตาราง"
              active={view === 'grid'}
              onClick={() => setView('grid')}
            />
            <ViewButton
              icon="list"
              label="แสดงแบบรายการ"
              active={view === 'list'}
              onClick={() => setView('list')}
            />
          </div>
        </div>
      </section>

      {results.length === 0 ? (
        <section className="mt-6 grid place-items-center rounded-2xl border border-dashed border-line bg-panel/60 px-6 py-14 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-surface text-ink-faint">
            <Icon name="search" className="size-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">ไม่พบสื่อที่ตรงกับเงื่อนไข</p>
          <p className="mt-1 text-xs text-ink-faint">ลองใช้คำค้นที่สั้นลง หรือเอาตัวกรองบางอันออก</p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/30 hover:text-ink"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </section>
      ) : view === 'grid' ? (
        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </section>
      ) : (
        <section className="mt-6 space-y-3">
          {results.map((item) => (
            <MediaRow key={item.id} media={item} />
          ))}
        </section>
      )}
      {totalPages > 1 && (
        <nav aria-label="หน้าผลการค้นหา" className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-line px-3 py-2 text-xs font-semibold ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-brand/40 hover:text-brand'}`}
          >
            ก่อนหน้า
          </Link>
          <span className="px-2 text-xs text-ink-faint">หน้า {page} จาก {totalPages}</span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-line px-3 py-2 text-xs font-semibold ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-brand/40 hover:text-brand'}`}
          >
            ถัดไป
          </Link>
        </nav>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ส่วนประกอบย่อย                                                       */
/* ------------------------------------------------------------------ */

function ViewButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-8 place-items-center rounded-md transition-colors ${
        active ? 'bg-brand/10 text-brand' : 'text-ink-faint hover:text-ink'
      }`}
    >
      <Icon name={icon} className="size-4" />
    </button>
  );
}

function FacetDropdown({
  label,
  icon,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  icon: IconName;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อคลิกที่อื่นหรือกด Esc — ผูก listener เฉพาะตอนเปิดอยู่เท่านั้น
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const active = selected.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        disabled={options.length === 0}
        className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm transition-colors disabled:opacity-40 ${
          active
            ? 'border-brand/40 bg-brand/10 text-brand'
            : 'border-line bg-surface text-ink-muted hover:border-brand/30 hover:text-ink'
        }`}
      >
        <Icon name={icon} className="size-4" />
        {label}
        {active && (
          <span className="grid size-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-line bg-panel p-1.5 shadow-xl shadow-black/10">
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const checked = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onToggle(option)}
                  aria-pressed={checked}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded border transition-colors ${
                      checked ? 'border-brand bg-brand text-white' : 'border-line'
                    }`}
                  >
                    {checked && <Icon name="check" className="size-3" />}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="mt-1 w-full rounded-lg border-t border-line/70 px-2.5 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
            >
              ล้าง{label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MediaRow({ media }: { media: MediaListItem }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-line/80 bg-panel p-4 shadow-sm shadow-black/[0.025] transition-colors hover:border-brand/30">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name="book" className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brand">
          {media.subject}
        </p>
        <h3 className="mt-0.5 truncate text-sm font-semibold text-ink">{media.title}</h3>
        <p className="mt-0.5 truncate text-xs text-ink-faint">
          {media.grade} · {media.type} · {media.author}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        <StatusBadge status={media.status} />
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <Icon name="download" className="size-3.5" />
          {media.downloads}
        </span>
      </div>
    </article>
  );
}
