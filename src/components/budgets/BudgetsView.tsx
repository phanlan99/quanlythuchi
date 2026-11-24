"use client";

import { useState, type FormEvent } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import {
  BUDGET_WARNING_THRESHOLD,
  getAvailableMonths,
  getBudgetUsage,
  nextMonthKey,
  type BudgetStatus,
  type BudgetUsage,
} from "@/lib/expense-utils";
import { formatCompactVND, formatVND } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Icons } from "@/components/sidebar/nav-config";
import {
  EmptyState,
  MonthSelect,
  PageHeader,
  ProgressBar,
  inputClass,
  stickyBarClass,
  surfaceClass,
} from "@/components/ui";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { CreateBudgetMonthDialog } from "./CreateBudgetMonthDialog";

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

/** "50.000" / "50,000" / "50000" -> 50000 */
const parseAmount = (raw: string) => Number(raw.replace(/[.,\s]/g, ""));

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
  const {
    transactions,
    categories,
    budgets,
    budgetMonths,
    setBudget,
    removeBudget,
    createBudgetMonth,
  } = useExpenses();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const month = selected && budgetMonths.includes(selected) ? selected : (budgetMonths[0] ?? "");

  // Suggest the month after the newest plan (or the newest month with transactions).
  const latest = budgetMonths[0] ?? getAvailableMonths(transactions)[0];
  const suggestedMonth = budgetMonths[0] ? nextMonthKey(budgetMonths[0]) : (latest ?? "");

  // Most-used budgets first, so problems are on top.
  const usage = month
    ? getBudgetUsage(budgets, transactions, categories, month).sort((a, b) => b.percent - a.percent)
    : [];
  const budgeted = new Set(usage.map((u) => u.category.id));
  const unbudgeted = categories.filter((c) => c.type === "expense" && !budgeted.has(c.id));

  const totalLimit = usage.reduce((s, u) => s + u.limit, 0);
  const totalSpent = usage.reduce((s, u) => s + u.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalStatus = statusOf(totalSpent, totalLimit);

  const openCreate = () => setCreating(true);

  return (
    <>
      <PageHeader
        title="Ngân sách"
        actions={
          budgetMonths.length > 0 && (
            <MonthSelect months={budgetMonths} value={month} onChange={setSelected} />
          )
        }
      />

      {!month ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-zinc-400">{Icons.calendarPlus}</span>
          <p className="text-sm text-zinc-500">Chưa có ngân sách nào</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Tạo ngân sách tháng
          </button>
        </div>
      ) : (
        <>
          {/* Sticky totals */}
          <div className={stickyBarClass}>
            <div className={`${surfaceClass} px-4 py-3`}>
              <dl className="grid grid-cols-3 gap-2 text-center sm:text-left">
                <div>
                  <dt className="text-xs text-zinc-500">Ngân sách</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums sm:text-base">
                    <Amount value={totalLimit} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Đã chi</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums sm:text-base">
                    <Amount value={totalSpent} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">
                    {totalRemaining >= 0 ? "Còn lại" : "Vượt"}
                  </dt>
                  <dd
                    className={`mt-0.5 text-sm font-semibold tabular-nums sm:text-base ${
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

          {usage.length === 0 ? (
            <EmptyState>Tháng này chưa có hạn mức. Thêm danh mục bên dưới.</EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {usage.map((u) => (
                <BudgetItem
                  key={u.category.id}
                  usage={u}
                  onSave={(limit) => setBudget(month, u.category.id, limit)}
                  onRemove={() => removeBudget(month, u.category.id)}
                />
              ))}
            </ul>
          )}

          {unbudgeted.length > 0 && (
            <AddCategoryBudget
              key={month}
              categories={unbudgeted}
              onAdd={(categoryId, limit) => setBudget(month, categoryId, limit)}
            />
          )}
        </>
      )}

      {/* Spacer so the floating button never covers the last card */}
      <div className="h-20" aria-hidden />

      {!creating && (
        <FloatingActionButton
          icon={Icons.calendarPlus}
          label="Tháng mới"
          onClick={openCreate}
        />
      )}

      {creating && (
        <CreateBudgetMonthDialog
          existingMonths={budgetMonths}
          defaultMonth={suggestedMonth}
          onClose={() => setCreating(false)}
          onCreate={(newMonth, copyFrom) => {
            createBudgetMonth(newMonth, copyFrom);
            setSelected(newMonth);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

function BudgetItem({
  usage: u,
  onSave,
  onRemove,
}: {
  usage: BudgetUsage;
  onSave: (limit: number) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const status = STATUS[u.status];

  function commit() {
    if (draft === null) return;
    const value = parseAmount(draft);
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
          <div className="flex items-center gap-1">
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
              className={`${inputClass} w-28 py-1 text-right`}
            />
            {/* preventDefault on mousedown keeps the input focused, so blur doesn't unmount this button first */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onRemove}
              aria-label={`Xóa hạn mức ${u.category.name}`}
              className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              Xóa
            </button>
          </div>
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

function AddCategoryBudget({
  categories,
  onAdd,
}: {
  categories: Category[];
  onAdd: (categoryId: string, limit: number) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const value = parseAmount(amount);
  const valid = categoryId !== "" && Number.isFinite(value) && value > 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    onAdd(categoryId, Math.round(value));
    setCategoryId("");
    setAmount("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${surfaceClass} mt-3 flex flex-wrap items-center gap-2 border-dashed p-3`}
    >
      <select
        aria-label="Danh mục"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className={`${inputClass} min-w-40 flex-1`}
      >
        <option value="">+ Thêm danh mục...</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>
      <input
        inputMode="numeric"
        placeholder="Hạn mức"
        aria-label="Hạn mức"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`${inputClass} w-32`}
      />
      <button
        type="submit"
        disabled={!valid}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Thêm
      </button>
    </form>
  );
}
