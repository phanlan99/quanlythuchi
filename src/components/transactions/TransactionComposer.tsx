"use client";

import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/use-is-client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useOverlay } from "@/hooks/use-overlay";
import type { Transaction } from "@/lib/types";
import { Card } from "@/components/ui";
import { Icons } from "@/components/sidebar/nav-config";
import { TransactionForm } from "./TransactionForm";

interface TransactionComposerProps {
  editing: Transaction | null;
  /** Called when a create/edit finishes or is cancelled. */
  onDone: () => void;
  /** Mobile sheet open state — lifted so other buttons (e.g. in the filter bar) can open it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Add / edit form in two presentations (switched by CSS at the `lg` breakpoint):
 * - Desktop: a card pinned (sticky) beside the list.
 * - Mobile: a floating "+" button that opens the form in a bottom sheet.
 *   Choosing "Sửa" on a row opens the sheet automatically.
 *
 * The mobile button + sheet are portaled to <body> so no ancestor layout,
 * stacking context or containing block can hide or clip them.
 */
export function TransactionComposer({
  editing,
  onDone,
  open,
  onOpenChange,
}: TransactionComposerProps) {
  const isClient = useIsClient();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const sheetOpen = !isDesktop && (open || editing !== null);
  const title = editing ? "Sửa giao dịch" : "Thêm mới";
  const formKey = editing?.id ?? "new";

  function close() {
    onOpenChange(false);
    onDone();
  }

  useOverlay(sheetOpen, close);

  const mobileUi = (
    <>
      {/* Mobile: floating action button */}
      {!sheetOpen && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="Thêm giao dịch"
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95 lg:hidden"
        >
          {Icons.plus}
        </button>
      )}

      {/* Mobile: bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 dark:bg-zinc-900"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{title}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Đóng"
                className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {Icons.close}
              </button>
            </div>
            <TransactionForm key={formKey} editing={editing} onDone={close} />
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: sticky card */}
      <div className="hidden self-start lg:sticky lg:top-20 lg:block">
        <Card title={title}>
          <TransactionForm key={formKey} editing={editing} onDone={onDone} />
        </Card>
      </div>

      {isClient && createPortal(mobileUi, document.body)}
    </>
  );
}
