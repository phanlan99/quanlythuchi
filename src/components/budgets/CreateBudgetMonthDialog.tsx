"use client";

import { useState, type FormEvent } from "react";
import { useOverlay } from "@/hooks/use-overlay";
import { formatMonth } from "@/lib/format";
import { inputClass } from "@/components/ui";
import { Icons } from "@/components/sidebar/nav-config";

interface CreateBudgetMonthDialogProps {
  /** Months that already have a budget (newest first). */
  existingMonths: string[];
  defaultMonth: string;
  onCreate: (month: string, copyFrom: string | null) => void;
  onClose: () => void;
}

/** Mount only while open — state starts fresh each time. */
export function CreateBudgetMonthDialog({
  existingMonths,
  defaultMonth,
  onCreate,
  onClose,
}: CreateBudgetMonthDialogProps) {
  const [month, setMonth] = useState(defaultMonth);
  const [copyFrom, setCopyFrom] = useState(existingMonths[0] ?? "");
  const [error, setError] = useState("");

  useOverlay(true, onClose);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(month)) return setError("Vui lòng chọn tháng");
    if (existingMonths.includes(month)) return setError("Tháng này đã có ngân sách");
    onCreate(month, copyFrom || null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-budget-title"
        onSubmit={handleSubmit}
        noValidate
        className="relative w-full space-y-4 rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-xl dark:bg-zinc-900"
      >
        <h2 id="create-budget-title" className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-emerald-600">{Icons.calendarPlus}</span>
          Tạo ngân sách tháng
        </h2>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Tháng</span>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setError("");
            }}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Hạn mức</span>
          <select
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            className={inputClass}
          >
            {existingMonths.map((m) => (
              <option key={m} value={m}>
                Sao chép từ {formatMonth(m).toLowerCase()}
              </option>
            ))}
            <option value="">Bắt đầu trống</option>
          </select>
        </label>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Tạo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
