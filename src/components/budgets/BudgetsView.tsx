"use client";

import { useState } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import {
  BUDGET_WARNING_THRESHOLD,
  getAvailableMonths,
  getBudgetUsage,
  type BudgetStatus,
  type BudgetUsage,
} from "@/lib/expense-utils";
import { formatCompactVND, formatVND } from "@/lib/format";
import { Icons } from "@/components/sidebar/nav-config";
import {
  MonthSelect,
  PageHeader,
  ProgressBar,
  inputClass,
  stickyBarClass,
  surfaceClass,
} from "@/components/ui";

/** Status colors (bar) + text style. Status is also spelled out in text, never color alone. */
const STATUS: Record<BudgetStatus, { bar?: string; text: string }> = {
  ok: { text: "text-zinc-500" },
  warning: { bar: "#fab219", text: "font-medium text-amber-600 dark:text-amber-400" },
  over: { bar: "#d03b3b", text: "font-medium text-rose-600 dark:text-rose-400" },
};

function statusOf(spent: number, limit: number): BudgetStatus {
  const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 101 : 0;
  return percent > 100 ? "over" : percent >= BUDGET_WARNING_THRESHOLD ? "warning" : "ok";
}

/** Full amount on sm+, compact ("1,5tr") on phones. */
function Amount({ value }: { value: number }) {
  return (
    <>
      <span className="sm:hidden">{formatCompactVND(value)}</span>
      <span className="hidden sm:inline">{formatVND(value)}</span>
    </>
  );
}

export function BudgetsView() {
  const { transactions, categories, budgets, setBudget } = useExpenses();
  const months = getAvailableMonths(transactions);
  const [selected, setSelected] = useState<string | null>(null);
  const month = selected && months.includes(selected) ? selected : (months[0] ?? "");

  // Most-used budgets first, so problems are on top.
  const usage = getBudgetUsage(budgets, transactions, categories, month).sort(
    (a, b) => b.percent - a.percent,
  );
  const totalLimit = usage.reduce((s, u) => s + u.limit, 0);
  const totalSpent = usage.reduce((s, u) => s + u.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalStatus = statusOf(totalSpent, totalLimit);

  return (
    <>
      <PageHeader
        title="Ngân sách"
        actions={<MonthSelect months={months} value={month} onChange={setSelected} />}
      />

      {/* Sticky totals */}
      <div className={stickyBarClass}>
        <div className={`${surfaceClass} px-4 py-3`}>
          <dl className="grid grid-cols-3 gap-2 text-center sm:text-left">
            <div>
              <dt className="text-xs text-zinc-500">Ngân sách</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums sm:text-lg">
                <Amount value={totalLimit} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Đã chi</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums sm:text-lg">
                <Amount value={totalSpent} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{totalRemaining >= 0 ? "Còn lại" : "Vượt"}</dt>
              <dd
                className={`mt-0.5 text-sm font-semibold tabular-nums sm:text-lg ${
                  totalRemaining < 0 ? "text-rose-600 dark:text-rose-400" : ""
                }`}
              >
                <Amount value={Math.abs(totalRemaining)} />
              </dd>
            </div>
          </dl>
          <div className="mt-3">
            <ProgressBar
              percent={totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0}
              color={STATUS[totalStatus].bar ?? "var(--series-expense)"}
            />
          </div>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {usage.map((u) => (
          <BudgetItem
            key={u.category.id}
            usage={u}
            onSave={(limit) => setBudget(u.category.id, limit)}
          />
        ))}
      </ul>
    </>
  );
}

function BudgetItem({ usage: u, onSave }: { usage: BudgetUsage; onSave: (limit: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const status = STATUS[u.status];

  function commit() {
    if (draft === null) return;
    const value = Number(draft.replace(/[.,\s]/g, ""));
    if (Number.isFinite(value) && value >= 0) onSave(Math.round(value));
    setDraft(null);
  }

  return (
    <li className={`${surfaceClass} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span aria-hidden>{u.category.icon}</span>
          <span className="truncate">{u.category.name}</span>
        </span>

        {draft !== null ? (
          <input
            autoFocus
            inputMode="numeric"
            aria-label={`Hạn mức ${u.category.name}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setDraft(null);
            }}
            className={`${inputClass} w-32 py-1 text-right`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setDraft(String(u.limit))}
            aria-label={`Sửa hạn mức ${u.category.name}`}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm tabular-nums text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {formatVND(u.limit)}
            {Icons.pencil}
          </button>
        )}
      </div>

      <div className="mt-3">
        <ProgressBar percent={u.percent} color={status.bar ?? u.category.color} />
      </div>

      <div className="mt-2 flex justify-between text-xs tabular-nums">
        <span className="text-zinc-500">Đã chi {formatVND(u.spent)}</span>
        <span className={status.text}>
          {u.status !== "ok" && "⚠ "}
          {u.remaining >= 0 ? `Còn ${formatVND(u.remaining)}` : `Vượt ${formatVND(-u.remaining)}`}
        </span>
      </div>
    </li>
  );
}
