"use client";

import { useState } from "react";
import type { Summary } from "@/lib/expense-utils";
import { formatVND } from "@/lib/format";
import type { Category, TransactionFilters } from "@/lib/types";
import { Icons } from "@/components/sidebar/nav-config";
import { MonthSelect, inputClass, stickyBarClass } from "@/components/ui";

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  /** Values that count as "no filter" (used for the badge and the reset). */
  defaults: TransactionFilters;
  months: string[];
  categories: Category[];
  summary: Summary;
  onChange: (filters: TransactionFilters) => void;
  /** When set, shows a "+" button (mobile only — desktop has the pinned form). */
  onAdd?: () => void;
}

/**
 * Sticky search + filters + totals. Search is always visible; the other
 * filters live in a collapsible panel to keep the bar small.
 *
 * Month and date range are mutually exclusive: picking a month clears the
 * range, and setting a range switches month to "all".
 */
export function TransactionFilterBar({
  filters,
  defaults,
  months,
  categories,
  summary,
  onChange,
  onAdd,
}: TransactionFilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const set = (patch: Partial<TransactionFilters>) => onChange({ ...filters, ...patch });

  const hasRange = Boolean(filters.dateFrom || filters.dateTo);
  const activeCount = [
    filters.type !== defaults.type,
    filters.categoryId !== defaults.categoryId,
    !hasRange && filters.month !== defaults.month,
    hasRange,
  ].filter(Boolean).length;

  function setRange(patch: Pick<Partial<TransactionFilters>, "dateFrom" | "dateTo">) {
    const next = { ...filters, ...patch };
    const rangeSet = Boolean(next.dateFrom || next.dateTo);
    onChange({ ...next, month: rangeSet ? "all" : defaults.month });
  }

  return (
    <div className={stickyBarClass}>
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Tìm kiếm..."
          aria-label="Tìm kiếm giao dịch"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="tx-filter-panel"
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
            expanded || activeCount > 0
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          {Icons.filter}
          <span>Lọc</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-emerald-600 px-1.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </button>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Thêm giao dịch"
            className="flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 text-white hover:bg-emerald-700 lg:hidden"
          >
            {Icons.plus}
          </button>
        )}
      </div>

      {expanded && (
        <div
          id="tx-filter-panel"
          className="mt-2 grid gap-2 rounded-xl border border-zinc-200/80 bg-white p-3 sm:grid-cols-2 xl:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <MonthSelect
            months={months}
            value={filters.month}
            onChange={(month) => set({ month, dateFrom: "", dateTo: "" })}
            includeAll
            className="w-full"
          />
          <select
            aria-label="Loại giao dịch"
            value={filters.type}
            onChange={(e) =>
              set({ type: e.target.value as TransactionFilters["type"], categoryId: "all" })
            }
            className={inputClass}
          >
            <option value="all">Thu & chi</option>
            <option value="expense">Chi</option>
            <option value="income">Thu</option>
          </select>
          <select
            aria-label="Danh mục"
            value={filters.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
            className={inputClass}
          >
            <option value="all">Tất cả danh mục</option>
            {categories
              .filter((c) => filters.type === "all" || c.type === filters.type)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <span className="w-8 shrink-0 text-zinc-500">Từ</span>
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => setRange({ dateFrom: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="w-8 shrink-0 text-zinc-500">Đến</span>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => setRange({ dateTo: e.target.value })}
              className={inputClass}
            />
          </label>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...defaults, search: filters.search })}
              className="rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      <div className="mt-2 flex gap-4 px-1 text-xs tabular-nums">
        <span className="text-emerald-600 dark:text-emerald-400">+{formatVND(summary.income)}</span>
        <span className="text-rose-600 dark:text-rose-400">−{formatVND(summary.expense)}</span>
        <span className="ml-auto font-medium">{formatVND(summary.balance)}</span>
      </div>
    </div>
  );
}
