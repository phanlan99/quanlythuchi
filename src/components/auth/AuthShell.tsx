"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type InputHTMLAttributes, type ReactNode } from "react";
import { useAuth } from "@/context/AuthProvider";
import { inputClass } from "@/components/ui";
import { FullPageSpinner } from "./AuthGate";

/**
 * Centered card for the signed-out pages (login, register, forgot password).
 * Signed-in visitors are sent on to the app.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const target =
    status === "authenticated" && user ? (user.mustChangePassword ? "/account" : "/dashboard") : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (status === "loading" || target) return <FullPageSpinner />;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            aria-label="Trang giới thiệu"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white"
          >
            ₫
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
          </div>
        </div>

        {status === "demo" ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Đăng nhập cần API trên Cloudflare. Chạy <code>npm run cf:dev</code> để thử, hoặc{" "}
            <Link href="/dashboard" className="font-medium underline">
              xem bản demo
            </Link>
            .
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {children}
          </div>
        )}

        {footer && <div className="mt-4 text-center text-sm text-zinc-500">{footer}</div>}
      </div>
    </main>
  );
}

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

/** Turn any thrown value into a message for the form. */
export const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Đã có lỗi, vui lòng thử lại";
