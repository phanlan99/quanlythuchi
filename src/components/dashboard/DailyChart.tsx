"use client";

import { useState, type KeyboardEvent } from "react";
import { dailyTotals } from "@/lib/expense-utils";
import { formatCompactVND, formatDate, formatVND } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { EmptyState } from "@/components/ui";

type Mode = "both" | "income" | "expense";
type Series = "income" | "expense";

const SERIES: Record<Series, { label: string; color: string }> = {
  income: { label: "Thu", color: "var(--series-income)" },
  expense: { label: "Chi", color: "var(--series-expense)" },
};

const MODES: { value: Mode; label: string }[] = [
  { value: "both", label: "Cả hai" },
  { value: "income", label: "Thu" },
  { value: "expense", label: "Chi" },
];

const TICK_COUNT = 4;

/** Round up to 1 / 2 / 5 × 10^n so axis ticks are readable. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const n = value / magnitude;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * magnitude;
}

interface DailyChartProps {
  transactions: Transaction[];
  /** YYYY-MM */
  month: string;
}

/** Daily income / expense bars for one month, with hover + keyboard tooltip. */
export function DailyChart({ transactions, month }: DailyChartProps) {
  const [mode, setMode] = useState<Mode>("both");
  const [active, setActive] = useState<number | null>(null);

  const days = dailyTotals(transactions, month);
  const series: Series[] = mode === "both" ? ["income", "expense"] : [mode];
  const dataMax = Math.max(0, ...days.flatMap((d) => series.map((s) => d[s])));
  const top = niceMax(dataMax);
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (top / TICK_COUNT) * i);
  const hasData = dataMax > 0;

  const activeDay = active !== null ? days[active] : null;
  const tooltipLeft = active !== null ? ((active + 0.5) / days.length) * 100 : 0;
  const tooltipShift =
    tooltipLeft < 15 ? "translate-x-0" : tooltipLeft > 85 ? "-translate-x-full" : "-translate-x-1/2";

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    setActive((i) => Math.min(days.length - 1, Math.max(0, (i ?? 0) + delta)));
  }

  return (
    <div>
      {/* Legend + series switch */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {series.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[s].color }} />
              {SERIES[s].label}
            </span>
          ))}
        </div>
        <div className="flex rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                mode === m.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyState>Chưa có dữ liệu</EmptyState>
      ) : (
        <>
          <div className="flex h-56">
            {/* Y axis */}
            <div className="relative w-12 shrink-0 text-[11px] tabular-nums text-zinc-400">
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-2 translate-y-1/2"
                  style={{ bottom: `${(t / top) * 100}%` }}
                >
                  {formatCompactVND(t)}
                </span>
              ))}
            </div>

            {/* Plot */}
            <div
              className="relative flex-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              tabIndex={0}
              role="group"
              aria-label="Biểu đồ thu chi theo ngày. Dùng phím mũi tên để xem từng ngày."
              onKeyDown={handleKeyDown}
              onFocus={() => setActive((i) => i ?? 0)}
              onBlur={() => setActive(null)}
              onMouseLeave={() => setActive(null)}
            >
              {/* Gridlines; baseline is slightly stronger */}
              {ticks.map((t) => (
                <div
                  key={t}
                  className={`absolute inset-x-0 border-t ${
                    t === 0
                      ? "border-zinc-300 dark:border-zinc-700"
                      : "border-zinc-100 dark:border-zinc-800"
                  }`}
                  style={{ bottom: `${(t / top) * 100}%` }}
                />
              ))}

              {/* Bars — each day column is the full-height hover target */}
              <div className="absolute inset-0 flex items-end">
                {days.map((d, i) => (
                  <div
                    key={d.date}
                    onMouseEnter={() => setActive(i)}
                    className={`flex h-full flex-1 items-end justify-center gap-0.5 px-px ${
                      active === i ? "bg-zinc-100/80 dark:bg-zinc-800/60" : ""
                    }`}
                  >
                    {series.map((s) => (
                      <div
                        key={s}
                        className="w-full max-w-2.5 rounded-t-sm"
                        style={{
                          height: `${(d[s] / top) * 100}%`,
                          minHeight: d[s] > 0 ? 2 : 0,
                          background: SERIES[s].color,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Tooltip */}
              {activeDay && (
                <div
                  role="status"
                  className={`pointer-events-none absolute top-0 z-10 min-w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${tooltipShift}`}
                  style={{ left: `${tooltipLeft}%` }}
                >
                  <p className="mb-1 font-medium">{formatDate(activeDay.date)}</p>
                  {series.map((s) => (
                    <p key={s} className="flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm" style={{ background: SERIES[s].color }} />
                        {SERIES[s].label}
                      </span>
                      <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatVND(activeDay[s])}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* X axis: label day 1 and every 5th day */}
          <div className="ml-12 mt-1.5 flex text-[11px] tabular-nums text-zinc-400">
            {days.map((d) => (
              <span key={d.date} className="flex-1 text-center">
                {d.day === 1 || d.day % 5 === 0 ? d.day : ""}
              </span>
            ))}
          </div>

          {/* Table view for screen readers */}
          <table className="sr-only">
            <caption>Thu chi theo ngày</caption>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Thu</th>
                <th>Chi</th>
              </tr>
            </thead>
            <tbody>
              {days
                .filter((d) => d.income > 0 || d.expense > 0)
                .map((d) => (
                  <tr key={d.date}>
                    <td>{formatDate(d.date)}</td>
                    <td>{formatVND(d.income)}</td>
                    <td>{formatVND(d.expense)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
