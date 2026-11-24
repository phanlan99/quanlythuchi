"use client";

import { useOverlay } from "@/hooks/use-overlay";
import type { Transaction } from "@/lib/types";
import { Icons } from "@/components/sidebar/nav-config";
import { TransactionForm } from "./TransactionForm";

interface TransactionDialogProps {
  /** Edit this transaction; omit to create a new one. */
  editing?: Transaction | null;
  /** Wallet preselected for a new transaction. */
  defaultWalletId?: string;
  /** Date (YYYY-MM-DD) preselected for a new transaction. */
  defaultDate?: string;
  onClose: () => void;
}

/**
 * Add / edit a transaction in a modal (bottom sheet on phones).
 * Used outside the Transactions page, e.g. from a wallet's history or the calendar.
 * Mount only while open — the form starts fresh each time.
 */
export function TransactionDialog({
  editing,
  defaultWalletId,
  defaultDate,
  onClose,
}: TransactionDialogProps) {
  useOverlay(true, onClose);
  const title = editing ? "Sửa giao dịch" : "Thêm giao dịch";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-xl dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {Icons.close}
          </button>
        </div>
        <TransactionForm
          editing={editing}
          defaultWalletId={defaultWalletId}
          defaultDate={defaultDate}
          onDone={onClose}
        />
      </div>
    </div>
  );
}
