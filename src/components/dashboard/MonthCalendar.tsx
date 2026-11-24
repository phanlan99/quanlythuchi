"use client";

import { useRef, useState } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import { useIsClient } from "@/hooks/use-is-client";
import { dailyTotals, sortByDateDesc, type DailyTotal } from "@/lib/expense-utils";
import {
  formatCompactVND,
  formatDate,
  formatLongDate,
  formatVND,
  todayISO,
  weekdayIndex,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { Icons } from "@/components/sidebar/nav-config";
import { Amount, EmptyState } from "@/components/ui";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Rows shown for a day before "Xem thêm" — keeps a busy day from burying the calendar. */
const DAY_PREVIEW_COUNT = 5;

const incomeText = "text-emerald-600 dark:text-emerald-400";
const expenseText = "text-rose-600 dark:text-rose-400";

/** Cell tint: the more spent that day, the stronger the red (rose-500). */
function heatColor(expense: number, max: number): string | undefined {
  if (expense <= 0 || max <= 0) return undefined;
  const strength = Math.round(6 + 24 * (expense / max)); // 6%..30%
  return `color-mix(in srgb, #f43f5e ${strength}%, transparent)`;
}

/** null = closed, "new" = add on the selected day, otherwise the transaction being edited. */
type TxDialog = "new" | Transaction | null;

interface MonthCalendarProps {
  /** YYYY-MM */
  month: string;
}

/**
 * Month at a glance: one cell per day (Monday-first), each with that day's
 * income / expense, tinted by how much was spent. Click a day to see its
 * transactions, edit them, or add one on that date.
 */
export function MonthCalendar({ month }: MonthCalendarProps) {
  const { transactions, removeTransaction } = useExpenses();
  const isClient = useIsClient();
  // "Today" only after hydration — the page is statically prerendered.
  const today = isClient ? todayISO() : "";
  const [picked, setPicked] = useState<string | null>(null);
  const [txDialog, setTxDialog] = useState<TxDialog>(null);
  /** Day whose full list is expanded (collapses again when another day is picked). */
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const days = dailyTotals(transactions, month);
  if (days.length === 0) return <EmptyState>Chưa có dữ liệu</EmptyState>;

  const leadingBlanks = weekdayIndex(days[0].date);
  const trailingBlanks = (7 - ((leadingBlanks + days.length) % 7)) % 7;
  const maxExpense = Math.max(0, ...days.map((d) => d.expense));

  // Default selection: today if it's in this month, else the latest day with activity.
  const activeDays = days.filter((d) => d.income > 0 || d.expense > 0);
  const fallback =
    days.find((d) => d.date === today)?.date ?? activeDays.at(-1)?.date ?? days[0].date;
  const selected = picked && picked.startsWith(month) ? picked : fallback;
  const selectedTotals = days.find((d) => d.date === selected);
  const selectedTx = sortByDateDesc(transactions.filter((t) => t.date === selected));
  const expanded = expandedDate === selected;
  const hiddenCount = expanded ? 0 : Math.max(0, selectedTx.length - DAY_PREVIEW_COUNT);
  const shownTx = hiddenCount > 0 ? selectedTx.slice(0, DAY_PREVIEW_COUNT) : selectedTx;

  /* ----- Simple month metrics ----- */
  // Days counted so far: up to today in the current month, all of a past month, none of a future one.
  const thisMonth = today.slice(0, 7);
  const elapsed = !today
    ? days.length
    : month === thisMonth
      ? Number(today.slice(8, 10))
      : month > thisMonth
        ? 0
        : days.length;
  const counted = days.slice(0, elapsed);
  const spent = counted.reduce((s, d) => s + d.expense, 0);
  const avgPerDay = elapsed > 0 ? Math.round(spent / elapsed) : 0;
  const peak = days.reduce<DailyTotal | null>(
    (best, d) => (d.expense > (best?.expense ?? 0) ? d : best),
    null,
  );
  const noSpendDays = counted.filter((d) => d.expense === 0).length;

  function select(date: string) {
    setPicked(date);
    // Below lg the detail sits under the grid — scroll its top just below the
    // sticky bars (see scroll-mt-* on the panel). Side by side on lg: no scroll.
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    requestAnimationFrame(() =>
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function handleDelete(t: Transaction) {
    if (!window.confirm(`Xóa giao dịch "${t.note || formatVND(t.amount)}"?`)) return;
    removeTransaction(t.id);
  }

  return (
    <div>
      {/* Three easy numbers */}
      <dl className="mb-4 grid grid-cols-3 gap-2">
        <Metric label="Chi TB / ngày">
          <Amount value={avgPerDay} />
        </Metric>
        <Metric label="Chi nhiều nhất">
          {peak ? (
            <button
              type="button"
              onClick={() => select(peak.date)}
              className="block max-w-full truncate text-left tabular-nums hover:underline"
              title={`Xem ngày ${formatDate(peak.date)}`}
            >
              <span className={expenseText}>{formatCompactVND(peak.expense)}</span>
              <span className="font-normal text-zinc-500"> · {peak.day}/{month.slice(5)}</span>
            </button>
          ) : (
            "—"
          )}
        </Metric>
        <Metric label="Ngày không chi">
          {noSpendDays}
          <span className="font-normal text-zinc-500"> / {elapsed} ngày</span>
        </Metric>
      </dl>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Calendar grid */}
        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-500 sm:text-xs">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`pb-1 ${i >= 5 ? "text-rose-500/80" : ""}`}>
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Lịch thu chi theo ngày">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <div key={`lead-${i}`} aria-hidden />
            ))}

            {days.map((d) => {
              const isSelected = d.date === selected;
              const isToday = d.date === today;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => select(d.date)}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDate(d.date)}: thu ${formatVND(d.income)}, chi ${formatVND(d.expense)}`}
                  className={`flex min-h-14 min-w-0 flex-col rounded-lg border p-1 text-left transition-colors sm:min-h-20 sm:p-1.5 ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-zinc-100 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                  style={{ backgroundColor: heatColor(d.expense, maxExpense) }}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium sm:text-xs ${
                      isToday ? "bg-emerald-600 text-white" : ""
                    }`}
                  >
                    {d.day}
                  </span>
                  <span className="mt-auto w-full truncate text-[10px] leading-tight tabular-nums sm:text-xs">
                    {d.income > 0 && (
                      <span className={`block truncate ${incomeText}`}>
                        +{formatCompactVND(d.income)}
                      </span>
                    )}
                    {d.expense > 0 && (
                      <span className={`block truncate font-medium ${expenseText}`}>
                        −{formatCompactVND(d.expense)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            {Array.from({ length: trailingBlanks }, (_, i) => (
              <div key={`trail-${i}`} aria-hidden />
            ))}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: heatColor(1, 4) }} />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: heatColor(1, 1) }} />
            Màu càng đậm = chi càng nhiều
          </p>
        </div>

        {/* Selected day. Phones: no extra frame (just a divider) so rows get the
            full card width; lg: a bordered side panel. scroll-mt clears the
            sticky header + stat bar when scrolled into view. */}
        <section
          ref={detailRef}
          aria-label={`Chi tiết ${formatLongDate(selected)}`}
          className="min-w-0 scroll-mt-48 border-t border-zinc-100 pt-4 md:scroll-mt-36 lg:self-start lg:rounded-xl lg:border lg:border-zinc-200/80 lg:p-4 dark:border-zinc-800 lg:dark:border-zinc-800"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{formatLongDate(selected)}</h3>
              <p className="text-xs text-zinc-500">
                {selectedTx.length > 0 ? `${selectedTx.length} giao dịch` : "Chưa có giao dịch"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTxDialog("new")}
              className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-emerald-200 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4">{Icons.plus}</span>
              Thêm
            </button>
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
            <DayTotal label="Thu" value={selectedTotals?.income ?? 0} className={incomeText} sign="+" />
            <DayTotal label="Chi" value={selectedTotals?.expense ?? 0} className={expenseText} sign="−" />
            <DayTotal
              label="Chênh lệch"
              value={(selectedTotals?.income ?? 0) - (selectedTotals?.expense ?? 0)}
            />
          </dl>

          <div className="mt-1">
            <TransactionList
              transactions={shownTx}
              onEdit={setTxDialog}
              onDelete={handleDelete}
              hideDate
              emptyText="Không có giao dịch trong ngày này."
            />
          </div>

          {(hiddenCount > 0 || (expanded && selectedTx.length > DAY_PREVIEW_COUNT)) && (
            <button
              type="button"
              onClick={() => setExpandedDate(expanded ? null : selected)}
              aria-expanded={expanded}
              className="mt-1 w-full rounded-lg py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              {expanded ? "Thu gọn" : `Xem thêm ${hiddenCount} giao dịch`}
            </button>
          )}
        </section>
      </div>

      {txDialog !== null && (
        <TransactionDialog
          key={txDialog === "new" ? `new-${selected}` : txDialog.id}
          editing={txDialog === "new" ? null : txDialog}
          defaultDate={selected}
          onClose={() => setTxDialog(null)}
        />
      )}
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
      <dt className="truncate text-[11px] text-zinc-500">{label}</dt>
      <dd className="truncate text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

function DayTotal({
  label,
  value,
  sign,
  className = "",
}: {
  label: string;
  value: number;
  sign?: string;
  className?: string;
}) {
  const signed = sign ?? (value < 0 ? "−" : value > 0 ? "+" : "");
  const color = sign ? className : value < 0 ? expenseText : value > 0 ? incomeText : "";
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-zinc-500">{label}</dt>
      <dd className={`truncate text-sm font-semibold tabular-nums ${color}`}>
        {signed}
        {formatCompactVND(Math.abs(value))}
      </dd>
    </div>
  );
}
