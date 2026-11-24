"use client";

import Link from "next/link";
import { useState } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import {
  filterTransactions,
  getAvailableMonths,
  getBudgetUsage,
  getWalletBalances,
  sortByDateDesc,
  summarize,
  totalsByCategory,
} from "@/lib/expense-utils";
import { formatVND } from "@/lib/format";
import {
  Card,
  EmptyState,
  MonthSelect,
  PageHeader,
  ProgressBar,
  StatCard,
  stickyBarClass,
} from "@/components/ui";
import { TransactionList } from "@/components/transactions/TransactionList";
import { DailyChart } from "./DailyChart";

export function DashboardView() {
  const { transactions, categories, budgets, wallets } = useExpenses();
  const months = getAvailableMonths(transactions);
  const [selected, setSelected] = useState<string | null>(null);
  // Fall back to the newest month if the selected one no longer has data.
  const month = selected && months.includes(selected) ? selected : (months[0] ?? "");

  const monthTx = filterTransactions(transactions, { month });
  const summary = summarize(monthTx);
  const byCategory = totalsByCategory(monthTx, categories, "expense");
  const recent = sortByDateDesc(monthTx).slice(0, 5);
  const alertCount = getBudgetUsage(budgets, transactions, categories, month).filter(
    (b) => b.status !== "ok",
  ).length;
  const totalAssets = getWalletBalances(wallets, transactions).reduce((s, w) => s + w.balance, 0);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        actions={<MonthSelect months={months} value={month} onChange={setSelected} />}
      />

      {/* Sticky, single row on every screen size */}
      <div className={stickyBarClass}>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Thu" amount={summary.income} dot="var(--series-income)" />
          <StatCard label="Chi" amount={summary.expense} dot="var(--series-expense)" />
          <StatCard label="Số dư" amount={summary.balance} />
        </div>
      </div>

      {wallets.length > 0 && (
        <Link
          href="/budgets#wallets"
          className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white px-4 py-2.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span className="text-zinc-500">
            Tổng tài sản · {wallets.length} ví / tài khoản
          </span>
          <span
            className={`font-semibold tabular-nums ${
              totalAssets < 0 ? "text-rose-600 dark:text-rose-400" : ""
            }`}
          >
            {formatVND(totalAssets)} <span aria-hidden>→</span>
          </span>
        </Link>
      )}

      <Card title="Thu chi theo ngày" className="mt-1">
        <DailyChart transactions={transactions} month={month} />
      </Card>

      {alertCount > 0 && (
        <Link
          href="/budgets"
          className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <span>{alertCount} danh mục sắp hết / vượt ngân sách</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Chi theo danh mục">
          {byCategory.length === 0 ? (
            <EmptyState>Chưa có khoản chi</EmptyState>
          ) : (
            <ul className="space-y-4">
              {byCategory.map(({ category, total, percent }) => (
                <li key={category.id}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>
                      {category.icon} {category.name}
                    </span>
                    <span className="tabular-nums text-zinc-500">{formatVND(total)}</span>
                  </div>
                  <ProgressBar percent={percent} color={category.color} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Gần đây"
          action={
            <Link href="/transactions" className="text-sm text-emerald-600 hover:underline">
              Tất cả
            </Link>
          }
        >
          <TransactionList transactions={recent} emptyText="Chưa có giao dịch" />
        </Card>
      </div>
    </>
  );
}
