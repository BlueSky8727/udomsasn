// src/components/dashboard/stat-card.tsx
import { Icon, type IconName } from '@/components/ui/icons';

export function StatCard({ label, value, delta, icon }: { label: string; value: string; delta: string; icon: IconName }) {
  return <article className="group rounded-2xl border border-line/80 bg-panel/80 p-5 shadow-sm shadow-black/[0.02] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-lg hover:shadow-brand/5">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm text-ink-muted">{label}</p><p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-ink">{value}</p></div>
      <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={icon} className="size-5" /></span>
    </div>
    <p className="mt-4 text-xs font-medium text-ink-faint">{delta}</p>
  </article>;
}
