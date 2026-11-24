"use client";

import { useState } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import {
  WALLET_KINDS,
  getWalletBalances,
  openingBalanceFor,
  walletKindLabel,
  type WalletBalance,
} from "@/lib/expense-utils";
import { formatCompactVND, formatVND } from "@/lib/format";
import { Icons } from "@/components/sidebar/nav-config";
import {
  Amount,
  iconButtonClass,
  iconButtonDangerClass,
  stickyBarClass,
  surfaceClass,
} from "@/components/ui";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { WalletDialog, type WalletDraft } from "./WalletDialog";
import { WalletHistory } from "./WalletHistory";

const negativeText = "text-rose-600 dark:text-rose-400";

type DialogState = { mode: "new" } | { mode: "edit"; id: string } | null;

/**
 * "Ví & tài khoản": every place the user keeps money, its live balance,
 * and the grand total. Balances are derived from linked transactions.
 */
export function WalletsPanel() {
  const { wallets, transactions, addWallet, updateWallet, removeWallet } = useExpenses();
  const [dialog, setDialog] = useState<DialogState>(null);
  /** Wallet whose history is open (null = wallet list). */
  const [viewingId, setViewingId] = useState<string | null>(null);

  const balances = getWalletBalances(wallets, transactions);
  const total = balances.reduce((s, b) => s + b.balance, 0);
  const positiveTotal = balances.reduce((s, b) => s + Math.max(b.balance, 0), 0);
  const byKind = WALLET_KINDS.map((k) => {
    const items = balances.filter((b) => b.wallet.kind === k.kind);
    return { ...k, count: items.length, total: items.reduce((s, b) => s + b.balance, 0) };
  }).filter((k) => k.count > 0);
  const unlinked = transactions.filter((t) => !t.walletId).length;

  const editing = dialog?.mode === "edit" ? balances.find((b) => b.wallet.id === dialog.id) : null;
  // Falls back to the list if the wallet no longer exists.
  const viewing = viewingId ? wallets.find((w) => w.id === viewingId) : undefined;
  const takenNames = wallets
    .filter((w) => w.id !== editing?.wallet.id)
    .map((w) => w.name.toLowerCase());

  function handleSave(draft: WalletDraft) {
    const { currentBalance, ...rest } = draft;
    if (editing) {
      const id = editing.wallet.id;
      updateWallet(id, { ...rest, openingBalance: openingBalanceFor(id, currentBalance, transactions) });
    } else {
      // New wallet has no transactions yet, so opening = current.
      addWallet({ ...rest, openingBalance: currentBalance });
    }
    setDialog(null);
  }

  function handleRemove(b: WalletBalance) {
    const linked =
      b.count > 0
        ? `\n${b.count} giao dịch liên quan vẫn được giữ lại nhưng sẽ không còn gắn với ví này.`
        : "";
    if (!window.confirm(`Xóa "${b.wallet.name}"?${linked}`)) return;
    removeWallet(b.wallet.id);
  }

  function openHistory(id: string | null) {
    setViewingId(id);
    window.scrollTo({ top: 0 });
  }

  const walletDialog = dialog && (dialog.mode === "new" || editing) && (
    <WalletDialog
      editing={editing}
      takenNames={takenNames}
      onClose={() => setDialog(null)}
      onSave={handleSave}
    />
  );

  if (viewing) {
    return (
      <>
        <WalletHistory
          wallet={viewing}
          onBack={() => openHistory(null)}
          onEditWallet={() => setDialog({ mode: "edit", id: viewing.id })}
        />
        {walletDialog}
      </>
    );
  }

  return (
    <>
      {wallets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-zinc-400">{Icons.wallet}</span>
          <p className="text-sm text-zinc-500">
            Chưa có ví / tài khoản nào.
            <br />
            Thêm ngân hàng, ví điện tử, tiền mặt, chứng khoán… để theo dõi số dư.
          </p>
          <button
            type="button"
            onClick={() => setDialog({ mode: "new" })}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Thêm ví / tài khoản
          </button>
        </div>
      ) : (
        <>
          {/* Sticky total */}
          <div className={stickyBarClass}>
            <div className={`${surfaceClass} px-4 py-3`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-zinc-500">Tổng tài sản</span>
                <span className="text-xs text-zinc-500">{wallets.length} ví / tài khoản</span>
              </div>
              <p
                className={`mt-0.5 text-xl font-semibold tabular-nums ${total < 0 ? negativeText : ""}`}
              >
                {formatVND(total)}
              </p>

              {/* Share of each wallet in the (positive) total */}
              {positiveTotal > 0 && (
                <div
                  className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                  aria-hidden
                >
                  {balances
                    .filter((b) => b.balance > 0)
                    .map((b) => (
                      <div
                        key={b.wallet.id}
                        className="h-full"
                        style={{
                          width: `${(b.balance / positiveTotal) * 100}%`,
                          backgroundColor: b.wallet.color,
                        }}
                      />
                    ))}
                </div>
              )}

              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {byKind.map((k) => (
                  <div key={k.kind} className="flex gap-1">
                    <dt className="text-zinc-500">{k.label}</dt>
                    <dd className={`font-medium tabular-nums ${k.total < 0 ? negativeText : ""}`}>
                      <Amount value={k.total} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {unlinked > 0 && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {unlinked} giao dịch chưa gắn ví nên chưa được tính vào số dư. Sửa giao dịch và chọn
              ví để gắn.
            </p>
          )}

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {balances.map((b) => (
              <WalletCard
                key={b.wallet.id}
                item={b}
                onOpen={() => openHistory(b.wallet.id)}
                onEdit={() => setDialog({ mode: "edit", id: b.wallet.id })}
                onRemove={() => handleRemove(b)}
              />
            ))}

            <li>
              <button
                type="button"
                onClick={() => setDialog({ mode: "new" })}
                aria-label="Thêm ví / tài khoản"
                className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-600 dark:border-zinc-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
              >
                {Icons.plus}
                <span className="text-xs font-medium">Thêm ví / tài khoản</span>
              </button>
            </li>
          </ul>
        </>
      )}

      {/* Spacer so the floating button never covers the last card */}
      <div className="h-20" aria-hidden />

      {dialog === null && (
        <FloatingActionButton
          icon={Icons.plus}
          label="Thêm ví"
          onClick={() => setDialog({ mode: "new" })}
        />
      )}

      {walletDialog}
    </>
  );
}

function WalletCard({
  item: b,
  onOpen,
  onEdit,
  onRemove,
}: {
  item: WalletBalance;
  /** Open this wallet's transaction history. */
  onOpen: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const w = b.wallet;
  return (
    <li className={`${surfaceClass} p-4`}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${w.color}22` }}
          aria-hidden
        >
          {w.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{w.name}</p>
          <p className="text-xs text-zinc-500">{walletKindLabel(w.kind)}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Sửa ${w.name}`}
          title="Sửa / cập nhật số dư"
          className={iconButtonClass}
        >
          {Icons.pencil}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Xóa ${w.name}`}
          title="Xóa"
          className={iconButtonDangerClass}
        >
          {Icons.trash}
        </button>
      </div>

      {/* Balance area opens the history */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem lịch sử giao dịch ${w.name}`}
        className="-mx-2 -mb-2 mt-1 block w-[calc(100%+1rem)] rounded-lg px-2 pb-2 pt-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
      >
        <span
          className={`block text-lg font-semibold tabular-nums ${b.balance < 0 ? negativeText : ""}`}
        >
          {formatVND(b.balance)}
        </span>

        <span className="mt-1 flex justify-between gap-2 text-xs tabular-nums text-zinc-500">
          <span>
            {b.count > 0 ? (
              <>
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{formatCompactVND(b.income)}
                </span>
                {" / "}
                <span className="text-rose-600 dark:text-rose-400">
                  −{formatCompactVND(b.expense)}
                </span>
              </>
            ) : (
              "Chưa có giao dịch"
            )}
          </span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {b.count > 0 ? `${b.count} giao dịch →` : "Xem →"}
          </span>
        </span>
      </button>
    </li>
  );
}
