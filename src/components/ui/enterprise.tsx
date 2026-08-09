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
  return (
    <div className={`rounded-2xl border border-line/80 bg-panel p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-faint">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-[-.04em]">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{detail}</p>
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
      className={`rounded-2xl border border-line/80 bg-panel p-5 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <h2 className="font-bold tracking-[-.02em]">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-ink-faint">{description}</p>}
      </div>
      {children}
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
