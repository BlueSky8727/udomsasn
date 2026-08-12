// src/components/review/queue-item.tsx
import { Icon } from '@/components/ui/icons';
import { StatusBadge } from '@/components/media/status-badge';
import type { MediaListItem } from '@/types/media-view';

export function QueueItem({ media, mine = false }: { media: MediaListItem; mine?: boolean }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line/80 bg-panel p-5 shadow-sm shadow-black/[0.02] sm:flex-row sm:items-center">
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name={mine ? 'shield' : 'file'} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{media.title}</h3>
          <StatusBadge status={media.status} />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {media.id} · {media.subject} · {media.grade} · ส่งโดย {media.author}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink-muted transition hover:border-brand/30 hover:text-brand">
          ดูรายละเอียด
        </button>
        <button className="rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-brand-contrast transition hover:bg-brand-strong">
          {mine ? 'ตรวจต่อ' : 'รับเรื่องตรวจ'}
        </button>
      </div>
    </article>
  );
}
