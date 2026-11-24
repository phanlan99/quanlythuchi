"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthProvider";
import { openAuthDialog } from "./auth-dialog-store";

export interface AuthGateOptions {
  /** Only admins may see this page (others go to the dashboard). */
  adminOnly?: boolean;
  /** Reachable while the user still has to replace a temporary password. */
  allowPasswordChange?: boolean;
}

/**
 * Client-side guard for protected pages (the static export has no server
 * middleware). The real protection is the API: every /api route checks the
 * session itself — this only keeps the UI consistent.
 */
export function AuthGate({ children, adminOnly, allowPasswordChange }: AuthGateOptions & { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  let redirect: string | null = null;
  if (status === "anonymous") redirect = "/"; // landing page, with the login dialog open
  else if (status === "authenticated" && user) {
    if (user.mustChangePassword && !allowPasswordChange) redirect = "/account";
    else if (adminOnly && user.role !== "admin") redirect = "/dashboard";
  }

  useEffect(() => {
    if (!redirect) return;
    if (status === "anonymous") openAuthDialog("login");
    router.replace(redirect);
  }, [redirect, status, router]);

  if (status === "loading" || redirect) return <FullPageSpinner />;
  return children;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <span
        role="status"
        aria-label="Đang tải"
        className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600"
      />
    </div>
  );
}
