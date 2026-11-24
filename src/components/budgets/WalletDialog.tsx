"use client";

import { useState, type FormEvent } from "react";
import { useOverlay } from "@/hooks/use-overlay";
import { WALLET_KINDS } from "@/lib/expense-utils";
import type { Wallet, WalletKind } from "@/lib/types";
import { inputClass } from "@/components/ui";
import { Icons } from "@/components/sidebar/nav-config";

/** What the dialog returns. The caller turns `currentBalance` into an opening balance. */
export interface WalletDraft {
  name: string;
  icon: string;
  color: string;
  kind: WalletKind;
  currentBalance: number;
}

interface WalletDialogProps {
  /** When set, edit this wallet (with its current computed balance). */
  editing?: { wallet: Wallet; balance: number } | null;
  /** Lowercase names of the user's other wallets — to prevent duplicates. */
  takenNames: string[];
  onSave: (draft: WalletDraft) => void;
  onClose: () => void;
}

const ICON_CHOICES = ["🏦", "💳", "📱", "💵", "👛", "📈", "🪙", "🐷", "💰", "🏠", "🚗", "📦"];
const COLOR_CHOICES = ["#1baf7a", "#2a78d6", "#6250d6", "#e87ba4", "#eda100", "#0ca30c", "#d03b3b", "#71717a"];

/** One-tap starting points for common Vietnamese banks / wallets / assets. */
const PRESETS: Omit<WalletDraft, "currentBalance">[] = [
  { name: "Vietcombank", icon: "🏦", color: "#1baf7a", kind: "bank" },
  { name: "BIDV", icon: "🏦", color: "#2a78d6", kind: "bank" },
  { name: "MBBank", icon: "💳", color: "#6250d6", kind: "bank" },
  { name: "Techcombank", icon: "🏦", color: "#d03b3b", kind: "bank" },
  { name: "MoMo", icon: "📱", color: "#e87ba4", kind: "ewallet" },
  { name: "ZaloPay", icon: "📱", color: "#2a78d6", kind: "ewallet" },
  { name: "Tiền mặt", icon: "💵", color: "#0ca30c", kind: "cash" },
  { name: "Chứng khoán", icon: "📈", color: "#6250d6", kind: "investment" },
  { name: "Crypto", icon: "🪙", color: "#eda100", kind: "investment" },
];

/** "-1.500.000" / "1,500,000" / "1500000" -> number (sign kept). */
const parseSignedAmount = (raw: string) => Number(raw.replace(/[.,\s]/g, ""));

/** Create / edit a wallet. Mount only while open — state starts fresh each time. */
export function WalletDialog({ editing, takenNames, onSave, onClose }: WalletDialogProps) {
  const w = editing?.wallet;
  const [name, setName] = useState(w?.name ?? "");
  const [icon, setIcon] = useState(w?.icon ?? ICON_CHOICES[0]);
  const [color, setColor] = useState(w?.color ?? COLOR_CHOICES[0]);
  const [kind, setKind] = useState<WalletKind>(w?.kind ?? "bank");
  const [balance, setBalance] = useState(editing ? String(editing.balance) : "");
  const [error, setError] = useState("");

  useOverlay(true, onClose);

  const presets = editing ? [] : PRESETS.filter((p) => !takenNames.includes(p.name.toLowerCase()));

  function applyPreset(p: (typeof PRESETS)[number]) {
    setName(p.name);
    setIcon(p.icon);
    setColor(p.color);
    setKind(p.kind);
    setError("");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Vui lòng nhập tên ví / tài khoản");
    if (trimmed.length > 40) return setError("Tên tối đa 40 ký tự");
    if (takenNames.includes(trimmed.toLowerCase())) return setError("Tên này đã tồn tại");
    const value = balance.trim() === "" ? 0 : parseSignedAmount(balance);
    if (!Number.isFinite(value) || Math.abs(value) > 1e13) return setError("Số dư không hợp lệ");
    onSave({ name: trimmed, icon, color, kind, currentBalance: Math.round(value) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-dialog-title"
        onSubmit={handleSubmit}
        noValidate
        className="relative max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 id="wallet-dialog-title" className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-emerald-600">{Icons.wallet}</span>
            {editing ? "Sửa ví / tài khoản" : "Thêm ví / tài khoản"}
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

        {presets.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Chọn nhanh</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  aria-pressed={name === p.name}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    name === p.name
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-medium">Tên</span>
          <input
            autoFocus={!editing}
            placeholder="VD: Vietcombank, Ví MoMo, Tiền mặt..."
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className={inputClass}
          />
        </label>

        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Loại</legend>
          <div className="flex flex-wrap gap-1.5">
            {WALLET_KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => setKind(k.kind)}
                aria-pressed={kind === k.kind}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  kind === k.kind
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Số dư hiện tại (VND)</span>
          <input
            autoFocus={!!editing}
            inputMode="numeric"
            placeholder="0"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value);
              setError("");
            }}
            className={`${inputClass} tabular-nums`}
          />
          <span className="block text-xs text-zinc-500">
            {editing
              ? "Nhập số dư thực tế (theo app ngân hàng) — các giao dịch đã ghi vẫn được giữ nguyên."
              : "Số tiền đang có ngay lúc này. Có thể nhập số âm (VD: thẻ tín dụng)."}
          </span>
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

        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Màu</legend>
          <div className="flex flex-wrap gap-2">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Màu ${c}`}
                aria-pressed={color === c}
                className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-white transition-shadow dark:ring-offset-zinc-900 ${
                  color === c ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {editing ? "Lưu" : "Thêm"}
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
