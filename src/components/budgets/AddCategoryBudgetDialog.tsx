"use client";

import { useState, type FormEvent } from "react";
import { useOverlay } from "@/hooks/use-overlay";
import { formatMonth } from "@/lib/format";
import type { Category } from "@/lib/types";
import { inputClass } from "@/components/ui";
import { Icons } from "@/components/sidebar/nav-config";

/** Either an existing category id, or a brand-new category to create. */
export type CategoryChoice =
  | { kind: "existing"; categoryId: string }
  | { kind: "new"; name: string; icon: string };

interface AddCategoryBudgetDialogProps {
  month: string;
  /** Expense categories that don't have a limit in this month yet. */
  available: Category[];
  /** All expense category names (lowercase) — to prevent duplicates when creating. */
  takenNames: string[];
  onAdd: (choice: CategoryChoice, limit: number) => void;
  onClose: () => void;
}

const ICON_CHOICES = ["📦", "☕", "🐶", "👶", "✈️", "🎮", "💄", "🔧", "🎁", "🏋️", "🚗", "📱"];

/** Mount only while open — state starts fresh each time. */
export function AddCategoryBudgetDialog({
  month,
  available,
  takenNames,
  onAdd,
  onClose,
}: AddCategoryBudgetDialogProps) {
  // Nothing left to pick? Start on "Tạo mới".
  const [mode, setMode] = useState<"existing" | "new">(available.length > 0 ? "existing" : "new");
  const [categoryId, setCategoryId] = useState(available[0]?.id ?? "");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useOverlay(true, onClose);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(amount.replace(/[.,\s]/g, ""));

    if (mode === "existing" && !categoryId) return setError("Vui lòng chọn danh mục");
    if (mode === "new") {
      const trimmed = name.trim();
      if (!trimmed) return setError("Vui lòng nhập tên danh mục");
      if (trimmed.length > 30) return setError("Tên tối đa 30 ký tự");
      if (takenNames.includes(trimmed.toLowerCase())) return setError("Danh mục này đã tồn tại");
    }
    if (!Number.isFinite(value) || value <= 0) return setError("Hạn mức phải lớn hơn 0");

    onAdd(
      mode === "existing"
        ? { kind: "existing", categoryId }
        : { kind: "new", name: name.trim(), icon },
      Math.round(value),
    );
  }

  const tab = (value: "existing" | "new", label: string, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setMode(value);
        setError("");
      }}
      aria-pressed={mode === value}
      className={`rounded-md py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        mode === value
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-category-budget-title"
        onSubmit={handleSubmit}
        noValidate
        className="relative max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 id="add-category-budget-title" className="text-sm font-semibold">
            Thêm danh mục · {formatMonth(month)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {Icons.close}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {tab("existing", "Có sẵn", available.length === 0)}
          {tab("new", "Tạo mới")}
        </div>

        {mode === "existing" ? (
          <label className="block space-y-1">
            <span className="text-sm font-medium">Danh mục</span>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setError("");
              }}
              className={inputClass}
            >
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Tên danh mục</span>
              <input
                autoFocus
                placeholder="VD: Thú cưng"
                maxLength={30}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                className={inputClass}
              />
            </label>
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">Biểu tượng</legend>
              <div className="grid grid-cols-6 gap-1.5">
                {ICON_CHOICES.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    aria-label={`Biểu tượng ${emoji}`}
                    aria-pressed={icon === emoji}
                    className={`flex h-10 items-center justify-center rounded-lg border text-lg transition-colors ${
                      icon === emoji
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                        : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-medium">Hạn mức (VND)</span>
          <input
            autoFocus={mode === "existing"}
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            className={inputClass}
          />
        </label>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Thêm
        </button>
      </form>
    </div>
  );
}
