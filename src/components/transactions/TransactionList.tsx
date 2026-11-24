"use client";

import { useExpenses } from "@/context/ExpenseProvider";
import { formatDate, formatVND } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { EmptyState } from "@/components/ui";

interface TransactionListProps {
  transactions: Transaction[];
  /** Show edit/delete buttons. */
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  emptyText?: string;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  emptyText = "Chưa có giao dịch nào.",
}: TransactionListProps) {
  const { getCategory, getWallet } = useExpenses();

  if (transactions.length === 0) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {transactions.map((t) => {
        const category = getCategory(t.categoryId);
        const wallet = getWallet(t.walletId);
        const isIncome = t.type === "income";
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${category?.color ?? "#71717a"}22` }}
              aria-hidden
            >
              {category?.icon ?? "❓"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.note || category?.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {category?.name ?? "Không rõ"}
                {wallet && ` · ${wallet.icon} ${wallet.name}`} · {formatDate(t.date)}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatVND(t.amount)}
            </p>
            {(onEdit || onDelete) && (
              <div className="flex shrink-0 gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Sửa
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(t)}
                    className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    Xóa
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
