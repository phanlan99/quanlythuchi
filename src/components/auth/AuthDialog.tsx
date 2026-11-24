"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthProvider";
import { useOverlay } from "@/hooks/use-overlay";
import type { PublicUser } from "@/lib/users";
import { Icons } from "@/components/sidebar/nav-config";
import {
  AUTH_HASHES,
  closeAuthDialog,
  openAuthDialog,
  useAuthDialogView,
  type AuthView,
} from "./auth-dialog-store";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

const COPY: Record<AuthView, { title: string; subtitle: string }> = {
  login: { title: "Đăng nhập", subtitle: "Chào mừng bạn quay lại" },
  register: { title: "Tạo tài khoản", subtitle: "Mỗi tài khoản quản lý thu chi riêng" },
  forgot: { title: "Quên mật khẩu", subtitle: "Quản trị viên sẽ cấp cho bạn mật khẩu tạm thời" },
};

/**
 * Login / register / forgot-password dialog, mounted on the landing page.
 * Open it from anywhere with `openAuthDialog(view)`.
 */
export function AuthDialog() {
  const view = useAuthDialogView();
  const { status } = useAuth();
  const router = useRouter();

  // Deep links: "/#login", "/#register", "/#forgot-password".
  useEffect(() => {
    const fromHash = AUTH_HASHES[window.location.hash];
    if (!fromHash) return;
    openAuthDialog(fromHash);
    history.replaceState(history.state, "", window.location.pathname + window.location.search);
  }, []);

  // Already signed in → nothing to show (also clears a stale request).
  useEffect(() => {
    if (status === "authenticated" && view) closeAuthDialog();
  }, [status, view]);

  if (!view || status === "loading" || status === "authenticated") return null;

  function handleSuccess(user: PublicUser) {
    closeAuthDialog();
    router.push(user.mustChangePassword ? "/account" : "/dashboard");
  }

  return <AuthDialogPanel view={view} demo={status === "demo"} onSuccess={handleSuccess} />;
}

function AuthDialogPanel({
  view,
  demo,
  onSuccess,
}: {
  view: AuthView;
  demo: boolean;
  onSuccess: (user: PublicUser) => void;
}) {
  useOverlay(true, closeAuthDialog);
  const { title, subtitle } = COPY[view];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeAuthDialog} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-sm sm:rounded-xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id="auth-dialog-title" className="text-base font-semibold">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={closeAuthDialog}
            aria-label="Đóng"
            className="-mr-2 -mt-1 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {Icons.close}
          </button>
        </div>

        {view !== "forgot" && (
          <div role="tablist" aria-label="Chọn" className="mx-5 mt-4 grid grid-cols-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["login", "register"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => openAuthDialog(v)}
                className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                  view === v
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {COPY[v].title}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {demo ? (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Đăng nhập cần API trên Cloudflare. Chạy <code>npm run cf:dev</code> để thử, hoặc{" "}
              <Link href="/dashboard" onClick={closeAuthDialog} className="font-medium underline">
                xem bản demo
              </Link>
              .
            </p>
          ) : view === "login" ? (
            <LoginForm key="login" onSwitch={openAuthDialog} onSuccess={onSuccess} />
          ) : view === "register" ? (
            <RegisterForm key="register" onSwitch={openAuthDialog} onSuccess={onSuccess} />
          ) : (
            <ForgotPasswordForm key="forgot" onSwitch={openAuthDialog} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
