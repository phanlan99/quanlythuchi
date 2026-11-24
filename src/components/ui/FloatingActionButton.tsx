"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/use-is-client";

interface FloatingActionButtonProps {
  icon: ReactNode;
  /** Visible text — makes it an "extended" pill FAB. */
  label: string;
  onClick: () => void;
  /** Hide at lg+ (when the page offers another control on desktop). Default: false. */
  mobileOnly?: boolean;
}

/**
 * Floating pill button, bottom-right.
 * Portaled to <body> so no ancestor layout can clip or hide it.
 */
export function FloatingActionButton({
  icon,
  label,
  onClick,
  mobileOnly = false,
}: FloatingActionButtonProps) {
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-emerald-600 pl-4 pr-5 text-sm font-medium text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95 md:bottom-8 md:right-8 ${
        mobileOnly ? "lg:hidden" : ""
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>,
    document.body,
  );
}
