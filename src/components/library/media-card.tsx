// src/components/library/media-card.tsx
import { Icon } from '@/components/ui/icons';
import { StatusBadge } from '@/components/media/status-badge';
import type { DemoMedia } from '@/constants/mock-data';

const accentMap: Record<string, string> = {
  sky: 'from-sky-500/18 via-cyan-400/8 to-transparent',
  violet: 'from-violet-500/18 via-fuchsia-400/8 to-transparent',
  rose: 'from-rose-500/18 via-pink-400/8 to-transparent',
  amber: 'from-amber-500/20 via-orange-400/8 to-transparent',
  emerald: 'from-emerald-500/18 via-teal-400/8 to-transparent',
  indigo: 'from-indigo-500/18 via-blue-400/8 to-transparent',
};

export function MediaCard({ media }: { media: DemoMedia }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-line/80 bg-panel shadow-sm shadow-black/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5">
      <div
        className={`relative h-36 overflow-hidden bg-gradient-to-br ${accentMap[media.accent] ?? accentMap.sky}`}
      >
        <div className="absolute -right-6 -top-8 size-28 rounded-full border border-white/20 bg-white/10" />
        <div className="absolute bottom-4 left-4 grid size-12 place-items-center rounded-2xl border border-white/30 bg-surface/80 text-brand shadow-sm backdrop-blur">
          <Icon name="book" className="size-6" />
        </div>
        <div className="absolute right-4 top-4">
          <StatusBadge status={media.status} />
        </div>
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brand">
          {media.subject}
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-ink transition-colors group-hover:text-brand">
          {media.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {media.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-surface/70 px-2.5 py-1 text-[11px] text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-line/80 pt-4 text-xs text-ink-faint">
          <span>
            {media.grade} · {media.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="download" className="size-3.5" />
            {media.downloads}
          </span>
        </div>
      </div>
    </article>
  );
}
