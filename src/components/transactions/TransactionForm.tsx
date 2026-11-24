"use client";

import { useState, type FormEvent } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import { hasErrors, validateTransaction, type ValidationErrors } from "@/lib/expense-utils";
import { todayISO } from "@/lib/format";
import type { Transaction, TransactionInput, TransactionType } from "@/lib/types";
import { inputClass } from "@/components/ui";

interface TransactionFormProps {
  /** When set, the form edits this transaction instead of creating a new one. */
  editing?: Transaction | null;
  onDone?: () => void;
}

/**
 * Create / edit form. Remount it with a different `key` to load another
 * transaction (see TransactionsView).
 */
export function TransactionForm({ editing, onDone }: TransactionFormProps) {
  const { categories, addTransaction, updateTransaction } = useExpenses();

  const [type, setType] = useState<TransactionType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  // Empty by default: pages are statically prerendered, so computing "today"
  // during render would cause a hydration mismatch. Filled in on submit.
  const [date, setDate] = useState(editing?.date ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [errors, setErrors] = useState<ValidationErrors>({});

  const categoryOptions = categories.filter((c) => c.type === type);

  function changeType(next: TransactionType) {
    setType(next);
    // Selected category may belong to the other type — reset it.
    if (!categories.some((c) => c.id === categoryId && c.type === next)) setCategoryId("");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input: TransactionInput = {
      type,
      // Accept "50.000" or "50,000" style input.
      amount: Number(amount.replace(/[.,\s]/g, "")),
      categoryId,
      date: date || todayISO(),
      note: note.trim(),
    };
    const validation = validateTransaction(input, categories);
    setErrors(validation);
    if (hasErrors(validation)) return;

    if (editing) {
      updateTransaction(editing.id, input);
    } else {
      addTransaction(input);
      setAmount("");
      setNote("");
    }
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            aria-pressed={type === t}
            className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
              type === t
                ? t === "expense"
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-600 text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t === "expense" ? "Chi tiêu" : "Thu nhập"}
          </button>
        ))}
      </div>

      <Field label="Số tiền (VND)" error={errors.amount}>
        <input
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Danh mục" error={errors.categoryId}>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">Chọn...</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ngày" error={errors.date}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Ghi chú" error={errors.note}>
        <input
          placeholder="Không bắt buộc"
          value={note}
          maxLength={120}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {editing ? "Lưu" : "Thêm"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
