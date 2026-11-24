"use client";

import { useExpenses } from "@/context/ExpenseProvider";
import { formatDate, formatVND } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { EmptyState, iconButtonClass, iconButtonDangerClass } from "@/components/ui";
import { Icons } from "@/components/sidebar/nav-config";

interface TransactionListProps {
  transactions: Transaction[];
  /** Show edit/delete buttons. */
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
  emptyText?: string;
  /** Leave the date out of each row (e.g. when the whole list is one day). */
  hideDate?: boolean;
}

/**
 * Transaction rows that stay readable in narrow containers (phones, side panels):
 * - left: note (wraps to 2 lines, breaks long words/URLs) + category · wallet · date
 * - right: full amount, with the edit/delete icons underneath it
 * so the text column never gets squeezed by fixed-width controls on the same line.
 */
export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  emptyText = "Chưa có giao dịch nào.",
  hideDate = false,
}: TransactionListProps) {
  const { getCategory, getWallet } = useExpenses();

  if (transactions.length === 0) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {transactions.map((t) => {
        const category = getCategory(t.categoryId);
        const wallet = getWallet(t.walletId);
        const isIncome = t.type === "income";
        const title = t.note || category?.name || "Không rõ";
        const meta = [
          category?.name ?? "Không rõ",
          wallet && `${wallet.icon} ${wallet.name}`,
          !hideDate && formatDate(t.date),
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li key={t.id} className="flex items-start gap-3 py-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base sm:h-10 sm:w-10 sm:text-lg"
              style={{ backgroundColor: `${category?.color ?? "#71717a"}22` }}
              aria-hidden
            >
              {category?.icon ?? "❓"}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]"
                title={title}
              >
                {title}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500" title={meta}>
                {meta}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <p
                className={`whitespace-nowrap text-sm font-semibold tabular-nums ${
                  isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isIncome ? "+" : "−"}
                {formatVND(t.amount)}
              </p>
              {(onEdit || onDelete) && (
                <div className="-mr-1.5 flex">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      aria-label={`Sửa giao dịch ${title}`}
                      title="Sửa"
                      className={iconButtonClass}
                    >
                      {Icons.pencil}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(t)}
                      aria-label={`Xóa giao dịch ${title}`}
                      title="Xóa"
                      className={iconButtonDangerClass}
                    >
                      {Icons.trash}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
