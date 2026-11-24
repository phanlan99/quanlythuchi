"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { openAuthDialog, type AuthView } from "@/components/auth/auth-dialog-store";

const primary =
  "rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700";
const secondary =
  "rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

/** Text-style button that opens the auth dialog (used in the footer). */
export function AuthLinkButton({ view, children }: { view: AuthView; children: string }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => openAuthDialog(view)}
      className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

/** Call-to-action buttons that adapt to whether the visitor is signed in. */
export function HeroActions({ align = "start" }: { align?: "start" | "center" }) {
  const { status, user } = useAuth();
  const wrap = `flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`;

  if (status === "authenticated" && user) {
    return (
      <div className={wrap}>
        <Link href="/dashboard" className={primary}>
          Vào trang tổng quan
        </Link>
        <Link href="/transactions" className={secondary}>
          Thêm giao dịch
        </Link>
      </div>
    );
  }

  if (status === "demo") {
    return (
      <div className={wrap}>
        <Link href="/dashboard" className={primary}>
          Xem bản demo
        </Link>
      </div>
    );
  }

  // Signed out (also the prerendered default while the session is checked).
  return (
    <div className={wrap}>
      <button type="button" aria-haspopup="dialog" onClick={() => openAuthDialog("register")} className={primary}>
        Tạo tài khoản
      </button>
      <button type="button" aria-haspopup="dialog" onClick={() => openAuthDialog("login")} className={secondary}>
        Đăng nhập
      </button>
    </div>
  );
}
