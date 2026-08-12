// src/components/ui/page-heading.tsx
import type { ReactNode } from 'react';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-navy-deep via-navy to-brand px-6 py-6 text-white shadow-sm sm:px-8 sm:py-7">
      <span className="absolute inset-y-0 left-0 w-2 bg-coral" />
      <div className="school-pattern pointer-events-none absolute inset-y-0 right-0 w-2/5 opacity-50" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-coral">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">{title}</h1>
        <p className="mt-2.5 max-w-xl text-sm leading-6 text-white/70 sm:text-[15px]">
          {description}
        </p>
      </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
