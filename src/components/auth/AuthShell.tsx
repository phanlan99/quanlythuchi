"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { inputClass } from "@/components/ui";

/*
 * Shared form building blocks for the auth dialog, Account and Admin pages.
 * (The auth forms themselves now open in a dialog on the landing page — see AuthDialog.tsx.)
 */

/** Labeled input with an optional inline error. */
export function Field({
  label,
  error,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = input.id ?? input.name;
  return (
    <label htmlFor={id} className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={`${inputClass} ${error ? "border-rose-400 dark:border-rose-700" : ""}`}
        {...input}
      />
      {error ? (
        <span className="block text-xs text-rose-600">{error}</span>
      ) : (
        hint && <span className="block text-xs text-zinc-500">{hint}</span>
      )}
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
      {message}
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Đang xử lý…" : children}
    </button>
  );
}

/** Small inline text button, e.g. "Đăng ký" / "Quên mật khẩu?" inside the dialog. */
export function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-medium text-emerald-600 hover:underline">
      {children}
    </button>
  );
}

/** Turn any thrown value into a message for the form. */
export const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Đã có lỗi, vui lòng thử lại";
