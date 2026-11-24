"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Icons } from "./nav-config";

/** Signed-in user at the bottom of the sidebar: avatar → Account page, plus Log out. */
export function UserCard({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  if (status !== "authenticated" || !user) return null;

  const initial = (user.fullName.trim()[0] ?? user.username[0]).toUpperCase();
  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      {initial}
    </span>
  );

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (compact) {
    return (
      <Link href="/account" title={user.fullName} aria-label="Tài khoản" className="flex justify-center py-3">
        {avatar}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/account" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{user.fullName}</span>
          <span className="block truncate text-xs text-zinc-500">
            @{user.username}
            {user.role === "admin" && " · Quản trị"}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Đăng xuất"
        title="Đăng xuất"
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"
      >
        {Icons.logout}
      </button>
    </div>
  );
}
