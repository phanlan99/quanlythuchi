import type { ReactNode } from "react";
import { formatCompactVND, formatMonth, formatVND } from "@/lib/format";

const surface =
  "rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900";
export const surfaceClass = surface;

/**
 * Sticky strip pinned right under the PageHeader (mobile: 56px top bar + 56px
 * header = top-28; md+: header only = top-14). Uses the page background so
 * content scrolls underneath cleanly.
 */
export const stickyBarClass =
  "sticky top-28 z-10 -mt-3 bg-zinc-50/95 pb-3 pt-3 backdrop-blur md:top-14 dark:bg-black/95";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${surface} p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Sticky one-line header: title on the left, controls on the right.
 * Bleeds to the edges of <main> (negative margins match its padding) and sits
 * below the 56px mobile top bar (top-14), or at the very top on desktop.
 */
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="sticky top-14 z-20 -mx-4 mb-6 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white/85 px-4 py-2.5 backdrop-blur md:top-0 md:-mx-8 md:px-8 dark:border-zinc-800 dark:bg-zinc-950/85">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * Compact stat: tiny label (with optional color dot) + amount.
 * Phones show the short form ("1,5tr") so three cards fit in one row.
 */
export function StatCard({
  label,
  amount,
  dot,
}: {
  label: string;
  amount: number;
  /** CSS color for a small marker, e.g. "var(--series-income)". */
  dot?: string;
}) {
  return (
    <div className={`${surface} min-w-0 px-3 py-2`}>
      <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />}
        {label}
      </p>
      <p className="truncate text-sm font-semibold tabular-nums">
        <span className="sm:hidden">{formatCompactVND(amount)}</span>
        <span className="hidden sm:inline">{formatVND(amount)}</span>
      </p>
    </div>
  );
}

/** Full amount on sm+, compact ("1,5tr") on phones. */
export function Amount({ value }: { value: number }) {
  return (
    <>
      <span className="sm:hidden">{formatCompactVND(value)}</span>
      <span className="hidden sm:inline">{formatVND(value)}</span>
    </>
  );
}

export function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const width = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

/** Small square icon button used for card actions (edit / delete). */
export const iconButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
export const iconButtonDangerClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950";

export const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900";

export function MonthSelect({
  months,
  value,
  onChange,
  includeAll = false,
  className = "w-auto",
}: {
  months: string[];
  value: string;
  onChange: (month: string) => void;
  includeAll?: boolean;
  className?: string;
}) {
  return (
    <select
      aria-label="Chọn tháng"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className}`}
    >
      {includeAll && <option value="all">Tất cả</option>}
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonth(m)}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-zinc-400">{children}</p>;
}
