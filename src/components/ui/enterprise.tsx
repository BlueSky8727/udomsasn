// src/components/ui/enterprise.tsx
import { Icon, type IconName } from './icons';
export function Metric({
  label,
  value,
  detail,
  icon,
  className = '',
}: {
  label: string;
  value: string;
  detail: string;
  icon: IconName;
  className?: string;
}) {
  const tones: Partial<Record<IconName, string>> = {
    check: 'bg-status-approved/12 text-status-approved',
    warning: 'bg-status-rejected/12 text-status-rejected',
    message: 'bg-coral/12 text-coral',
    edit: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
    clock: 'bg-status-pending/12 text-status-pending',
    inbox: 'bg-status-pending/12 text-status-pending',
    refresh: 'bg-coral/12 text-coral',
  };
  const tone = tones[icon] ?? 'bg-brand/10 text-brand';

  return (
    <div className={`rounded-xl border border-line/80 bg-panel p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3.5">
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon name={icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-muted">{label}</p>
          <p className="mt-0.5 text-3xl font-bold leading-none tracking-[-.04em]">{value}</p>
        </div>
      </div>
      <p className="mt-3 border-t border-line/70 pt-2.5 text-[11px] text-ink-faint">{detail}</p>
    </div>
  );
}
export function SectionCard({
  title,
  description,
  className = '',
  children,
}: {
  title: string;
  description?: string;
  /** ระยะห่างจากของที่อยู่ข้างบน การ์ดไม่กำหนด margin ให้เอง ผู้เรียกต้องสั่งเสมอ */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-line/80 bg-panel shadow-sm ${className}`}
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-deep to-navy px-5 py-3.5 text-white">
        <div className="school-pattern-soft pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative">
          <h2 className="font-bold tracking-[-.02em]">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-white/65">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
export function Pill({
  children,
  tone = 'brand',
}: {
  children: React.ReactNode;
  tone?: 'brand' | 'ok' | 'warn' | 'danger' | 'neutral';
}) {
  const c = {
    brand: 'bg-brand/10 text-brand',
    ok: 'bg-status-approved/10 text-status-approved',
    warn: 'bg-status-pending/10 text-status-pending',
    danger: 'bg-status-rejected/10 text-status-rejected',
    neutral: 'bg-surface text-ink-muted',
  }[tone];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${c}`}>
      {children}
    </span>
  );
}

/** ป้ายข้อมูลเวลาแบบพื้นเหลืองทึบ แยกจากป้ายสถานะเพื่อให้อ่านง่าย */
export function TimeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-status-pending bg-status-pending px-2 py-1 text-[11px] font-semibold leading-none text-slate-950 shadow-sm">
      <Icon name="clock" className="size-3 text-slate-950" />
      {children}
    </span>
  );
}
