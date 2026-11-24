"use client";

import { useState } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import {
  getAvailableMonths,
  getWalletHistory,
  getWalletPeriod,
  monthKey,
  totalsByCategory,
  walletKindLabel,
  type WalletEntry,
} from "@/lib/expense-utils";
import { formatDate, formatMonth, formatVND } from "@/lib/format";
import type { Transaction, TransactionType, Wallet } from "@/lib/types";
import { Icons } from "@/components/sidebar/nav-config";
import {
  Amount,
  Card,
  EmptyState,
  MonthSelect,
  ProgressBar,
  iconButtonClass,
  iconButtonDangerClass,
  stickyBarClass,
  surfaceClass,
} from "@/components/ui";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";

const negativeText = "text-rose-600 dark:text-rose-400";
const incomeText = "text-emerald-600 dark:text-emerald-400";

const TYPE_FILTERS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "expense", label: "Chi" },
  { value: "income", label: "Thu" },
];

/** null = closed, "new" = add, otherwise the transaction being edited. */
type TxDialog = "new" | Transaction | null;

interface WalletHistoryProps {
  wallet: Wallet;
  onBack: () => void;
  onEditWallet: () => void;
}

/**
 * One wallet's statement: period summary (opening → in/out → closing), every
 * transaction with the running balance after it, and spending by category.
 */
export function WalletHistory({ wallet, onBack, onEditWallet }: WalletHistoryProps) {
  const { transactions, categories, getCategory, removeTransaction } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType | "all">("all");
  const [txDialog, setTxDialog] = useState<TxDialog>(null);

  const history = getWalletHistory(wallet, transactions);
  const current = history[0]?.balanceAfter ?? wallet.openingBalance;
  const months = getAvailableMonths(history.map((e) => e.transaction));
  // Default to the newest month with activity; fall back if that month empties out.
  const month =
    selectedMonth === "all" || (selectedMonth && months.includes(selectedMonth))
      ? selectedMonth
      : (months[0] ?? "all");

  const period = getWalletPeriod(wallet, history, month);
  const inMonth =
    month === "all" ? history : history.filter((e) => monthKey(e.transaction.date) === month);
  const visible = type === "all" ? inMonth : inMonth.filter((e) => e.transaction.type === type);
  const byCategory = totalsByCategory(
    inMonth.map((e) => e.transaction),
    categories,
    "expense",
  );

  // Group consecutive entries (already newest first) by day.
  const days: { date: string; net: number; entries: WalletEntry[] }[] = [];
  for (const e of visible) {
    const t = e.transaction;
    const signed = t.type === "income" ? t.amount : -t.amount;
    const last = days.at(-1);
    if (last && last.date === t.date) {
      last.entries.push(e);
      last.net += signed;
    } else {
      days.push({ date: t.date, net: signed, entries: [e] });
    }
  }

  const isAll = month === "all";

  function handleDelete(t: Transaction) {
    if (!window.confirm(`Xóa giao dịch "${t.note || formatVND(t.amount)}"?`)) return;
    removeTransaction(t.id);
  }

  return (
    <>
      {/* Wallet header */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại danh sách ví"
          title="Tất cả ví"
          className={iconButtonClass}
        >
          {Icons.chevronLeft}
        </button>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${wallet.color}22` }}
          aria-hidden
        >
          {wallet.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{wallet.name}</h2>
          <p className="text-xs text-zinc-500">
            {walletKindLabel(wallet.kind)} · {history.length} giao dịch
          </p>
        </div>
        <button
          type="button"
          onClick={onEditWallet}
          aria-label={`Sửa ${wallet.name}`}
          title="Sửa / cập nhật số dư"
          className={iconButtonClass}
        >
          {Icons.pencil}
        </button>
      </div>

      {/* Sticky period summary */}
      <div className={stickyBarClass}>
        <div className={`${surfaceClass} px-4 py-3`}>
          <div className="flex items-baseline justify-between gap-3 text-xs text-zinc-500">
            <span>{isAll ? "Toàn bộ thời gian" : formatMonth(month)}</span>
            <span>
              Số dư hiện tại{" "}
              <span className={`font-semibold tabular-nums ${current < 0 ? negativeText : "text-zinc-900 dark:text-zinc-100"}`}>
                {formatVND(current)}
              </span>
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-4 gap-2 text-center sm:text-left">
            <SummaryItem
              label={isAll ? "Ban đầu" : "Đầu kỳ"}
              value={period.start}
              className={period.start < 0 ? negativeText : ""}
            />
            <SummaryItem label="Thu" value={period.income} sign="+" className={incomeText} />
            <SummaryItem label="Chi" value={period.expense} sign="−" className={negativeText} />
            <SummaryItem
              label={isAll ? "Hiện tại" : "Cuối kỳ"}
              value={period.end}
              className={period.end < 0 ? negativeText : ""}
            />
          </dl>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MonthSelect months={months} value={month} onChange={setSelectedMonth} includeAll />
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setType(f.value)}
              aria-pressed={type === f.value}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                type === f.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0">
          {days.length === 0 ? (
            <EmptyState>
              {history.length === 0
                ? "Chưa có giao dịch nào dùng ví này."
                : "Không có giao dịch trong khoảng đã chọn."}
            </EmptyState>
          ) : (
            <div className="-my-2 space-y-1">
              {days.map((day) => (
                <section key={day.date}>
                  <h3 className="flex justify-between border-b border-zinc-100 py-2 text-xs font-medium text-zinc-500 dark:border-zinc-800">
                    <span>{formatDate(day.date)}</span>
                    <span className={`tabular-nums ${day.net < 0 ? negativeText : incomeText}`}>
                      {day.net < 0 ? "−" : "+"}
                      {formatVND(Math.abs(day.net))}
                    </span>
                  </h3>
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {day.entries.map(({ transaction: t, balanceAfter }) => {
                      const category = getCategory(t.categoryId);
                      const isIncome = t.type === "income";
                      return (
                        <li key={t.id} className="flex items-center gap-3 py-2.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${category?.color ?? "#71717a"}22` }}
                            aria-hidden
                          >
                            {category?.icon ?? "❓"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {t.note || category?.name}
                            </p>
                            <p className="truncate text-xs tabular-nums text-zinc-500">
                              {category?.name ?? "Không rõ"} · Số dư{" "}
                              <span className={balanceAfter < 0 ? negativeText : ""}>
                                {formatVND(balanceAfter)}
                              </span>
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm font-semibold tabular-nums ${
                              isIncome ? incomeText : negativeText
                            }`}
                          >
                            {isIncome ? "+" : "−"}
                            <Amount value={t.amount} />
                          </p>
                          <div className="flex shrink-0">
                            <button
                              type="button"
                              onClick={() => setTxDialog(t)}
                              aria-label={`Sửa giao dịch ${t.note || category?.name || ""}`}
                              title="Sửa"
                              className={iconButtonClass}
                            >
                              {Icons.pencil}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t)}
                              aria-label={`Xóa giao dịch ${t.note || category?.name || ""}`}
                              title="Xóa"
                              className={iconButtonDangerClass}
                            >
                              {Icons.trash}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              {/* The statement's starting point */}
              {isAll && type === "all" && (
                <p className="flex justify-between border-t border-zinc-100 py-2.5 text-xs text-zinc-500 dark:border-zinc-800">
                  <span>Số dư ban đầu</span>
                  <span className="tabular-nums">{formatVND(wallet.openingBalance)}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Chi theo danh mục" className="self-start">
          {byCategory.length === 0 ? (
            <EmptyState>Chưa có khoản chi</EmptyState>
          ) : (
            <ul className="space-y-3">
              {byCategory.map(({ category, total, percent }) => (
                <li key={category.id}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="truncate">
                      {category.icon} {category.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-zinc-500">
                      {formatVND(total)} · {Math.round(percent)}%
                    </span>
                  </div>
                  <ProgressBar percent={percent} color={category.color} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Spacer so the floating button never covers the last row */}
      <div className="h-20" aria-hidden />

      {txDialog === null && (
        <FloatingActionButton
          icon={Icons.plus}
          label="Thêm giao dịch"
          onClick={() => setTxDialog("new")}
        />
      )}

      {txDialog !== null && (
        <TransactionDialog
          key={txDialog === "new" ? "new" : txDialog.id}
          editing={txDialog === "new" ? null : txDialog}
          defaultWalletId={wallet.id}
          onClose={() => setTxDialog(null)}
        />
      )}
    </>
  );
}

function SummaryItem({
  label,
  value,
  sign = "",
  className = "",
}: {
  label: string;
  value: number;
  sign?: string;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm font-semibold tabular-nums sm:text-base ${className}`}>
        {sign}
        <Amount value={value} />
      </dd>
    </div>
  );
}
