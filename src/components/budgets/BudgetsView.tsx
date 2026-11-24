"use client";

import { useState } from "react";
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
import { Icons } from "@/components/sidebar/nav-config";
import {
  MonthSelect,
  PageHeader,
  ProgressBar,
  inputClass,
  stickyBarClass,
  surfaceClass,
} from "@/components/ui";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { AddCategoryBudgetDialog } from "./AddCategoryBudgetDialog";
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

const CUSTOM_COLORS = ["#2a78d6", "#1baf7a", "#e87ba4", "#6250d6", "#eda100", "#0ca30c"];

/** "50.000" / "50,000" / "50000" -> 50000 */
const parseAmount = (raw: string) => Number(raw.replace(/[.,\s]/g, ""));

/** Small square icon button used for card actions. */
const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
const iconButtonDanger =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950";

/** Full amount on sm+, compact ("1,5tr") on phones. */
function Amount({ value }: { value: number }) {
  return (
    <>
      <span className="sm:hidden">{formatCompactVND(value)}</span>
      <span className="hidden sm:inline">{formatVND(value)}</span>
    </>
  );
}

type Dialog = "createMonth" | "addCategory" | null;

export function BudgetsView() {
  const {
    transactions,
    categories,
    budgets,
    budgetMonths,
    setBudget,
    removeBudget,
    createBudgetMonth,
    addCategory,
  } = useExpenses();
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const month = selected && budgetMonths.includes(selected) ? selected : (budgetMonths[0] ?? "");

  // Suggest the month after the newest plan (or the newest month with transactions).
  const suggestedMonth = budgetMonths[0]
    ? nextMonthKey(budgetMonths[0])
    : (getAvailableMonths(transactions)[0] ?? "");

  // Most-used budgets first, so problems are on top.
  const usage = month
    ? getBudgetUsage(budgets, transactions, categories, month).sort((a, b) => b.percent - a.percent)
    : [];
  const budgeted = new Set(usage.map((u) => u.category.id));
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const unbudgeted = expenseCategories.filter((c) => !budgeted.has(c.id));

  const totalLimit = usage.reduce((s, u) => s + u.limit, 0);
  const totalSpent = usage.reduce((s, u) => s + u.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalStatus = statusOf(totalSpent, totalLimit);

  function handleRemove(u: BudgetUsage) {
    if (!window.confirm(`Xóa danh mục "${u.category.name}" khỏi ngân sách tháng này?`)) return;
    removeBudget(month, u.category.id);
  }

  return (
    <>
      <PageHeader
        title="Ngân sách"
        actions={
          month && <MonthSelect months={budgetMonths} value={month} onChange={setSelected} />
        }
      />

      {!month ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-zinc-400">{Icons.calendarPlus}</span>
          <p className="text-sm text-zinc-500">Chưa có ngân sách nào</p>
          <button
            type="button"
            onClick={() => setDialog("createMonth")}
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

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {usage.map((u) => (
              <BudgetItem
                key={u.category.id}
                usage={u}
                onSave={(limit) => setBudget(month, u.category.id, limit)}
                onRemove={() => handleRemove(u)}
              />
            ))}

            {/* "Add category" tile — always the last cell; can also create a new category */}
            <li>
              <button
                type="button"
                onClick={() => setDialog("addCategory")}
                aria-label="Thêm danh mục vào ngân sách tháng này"
                className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-600 dark:border-zinc-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
              >
                {Icons.plus}
                <span className="text-xs font-medium">Thêm danh mục</span>
              </button>
            </li>
          </ul>
        </>
      )}

      {/* Spacer so the floating button never covers the last card */}
      <div className="h-20" aria-hidden />

      {dialog === null && (
        <FloatingActionButton
          icon={Icons.calendarPlus}
          label="Tháng mới"
          onClick={() => setDialog("createMonth")}
        />
      )}

      {dialog === "createMonth" && (
        <CreateBudgetMonthDialog
          existingMonths={budgetMonths}
          defaultMonth={suggestedMonth}
          onClose={() => setDialog(null)}
          onCreate={(newMonth, copyFrom) => {
            createBudgetMonth(newMonth, copyFrom);
            setSelected(newMonth);
            setDialog(null);
          }}
        />
      )}

      {dialog === "addCategory" && month && (
        <AddCategoryBudgetDialog
          month={month}
          available={unbudgeted}
          takenNames={expenseCategories.map((c) => c.name.toLowerCase())}
          onClose={() => setDialog(null)}
          onAdd={(choice, limit) => {
            const categoryId =
              choice.kind === "existing"
                ? choice.categoryId
                : addCategory({
                    name: choice.name,
                    icon: choice.icon,
                    type: "expense",
                    // Rotate through a few distinct hues for custom categories.
                    color: CUSTOM_COLORS[expenseCategories.length % CUSTOM_COLORS.length],
                  }).id;
            setBudget(month, categoryId, limit);
            setDialog(null);
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
  const editing = draft !== null;
  const status = STATUS[u.status];

  function commit() {
    if (draft === null) return;
    const value = parseAmount(draft);
    if (Number.isFinite(value) && value >= 0) onSave(Math.round(value));
    setDraft(null);
  }

  return (
    <li className={`${surfaceClass} p-4`}>
      <div className="flex items-center gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <span aria-hidden>{u.category.icon}</span>
          <span className="truncate">{u.category.name}</span>
        </span>

        {/* Card actions: icons on every screen size */}
        {editing ? (
          <>
            <button type="button" onClick={commit} aria-label="Lưu" title="Lưu" className={iconButton}>
              <span className="text-emerald-600">{Icons.check}</span>
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              aria-label="Hủy"
              title="Hủy"
              className={iconButton}
            >
              {Icons.close}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setDraft(String(u.limit))}
              aria-label={`Sửa hạn mức ${u.category.name}`}
              title="Sửa hạn mức"
              className={iconButton}
            >
              {Icons.pencil}
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Xóa ${u.category.name} khỏi tháng này`}
              title="Xóa danh mục"
              className={iconButtonDanger}
            >
              {Icons.trash}
            </button>
          </>
        )}
      </div>

      {editing ? (
        <input
          autoFocus
          inputMode="numeric"
          aria-label={`Hạn mức ${u.category.name}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(null);
          }}
          className={`${inputClass} mt-2 tabular-nums`}
        />
      ) : (
        <p className="mt-1 text-sm tabular-nums text-zinc-500">{formatVND(u.limit)}</p>
      )}

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
