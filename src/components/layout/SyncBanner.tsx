"use client";

import { useExpenses } from "@/context/ExpenseProvider";

const errorClass = "-mx-4 bg-rose-600 px-4 py-1.5 text-center text-xs text-white md:-mx-8";

/** Thin notice when data isn't being saved to D1. Renders nothing when all is well. */
export function SyncBanner() {
  const { status, syncError } = useExpenses();

  if (status === "error") {
    return (
      <p role="alert" className={errorClass}>
        Không tải được dữ liệu. Tải lại trang để thử lại.
      </p>
    );
  }
  if (syncError) {
    return (
      <p role="alert" className={errorClass}>
        Không lưu được thay đổi. Tải lại trang để đồng bộ.
      </p>
    );
  }
  if (status === "demo") {
    return (
      <p className="-mx-4 bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-800 md:-mx-8 dark:bg-amber-950 dark:text-amber-300">
        Chế độ demo — chưa kết nối Cloudflare D1, dữ liệu không được lưu.
      </p>
    );
  }
  return null;
}
