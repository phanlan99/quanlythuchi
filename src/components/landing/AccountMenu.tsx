"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAuth } from "@/context/AuthProvider";
import { ADMIN_NAV_ITEMS, DEFAULT_NAV_ITEMS, Icons } from "@/components/sidebar/nav-config";
import { openAuthDialog } from "@/components/auth/auth-dialog-store";

const pill =
  "flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors";

/**
 * Navbar account control.
 * - Signed out: login icon → /login
 * - Signed in:  username button → menu with the app sections + Log out
 */
export function AccountMenu() {
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // While open: close on outside click / Escape, and move focus into the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (status === "loading") {
    return <span aria-hidden className="h-9 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />;
  }

  if (status === "demo") {
    return (
      <Link href="/dashboard" className={`${pill} bg-emerald-600 text-white hover:bg-emerald-700`}>
        {Icons.login}
        <span>Xem demo</span>
      </Link>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <button
        type="button"
        onClick={() => openAuthDialog("login")}
        aria-label="Đăng nhập"
        aria-haspopup="dialog"
        className={`${pill} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800`}
      >
        {Icons.login}
        <span className="hidden sm:inline">Đăng nhập</span>
      </button>
    );
  }

  const items = user.role === "admin" ? [...DEFAULT_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : DEFAULT_NAV_ITEMS;
  const close = () => setOpen(false);

  // Arrow keys / Home / End move between items; Tab leaves the menu.
  function handleMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => {
      e.preventDefault();
      nodes[(i + nodes.length) % nodes.length]?.focus();
    };
    if (e.key === "ArrowDown") focusAt(index + 1);
    else if (e.key === "ArrowUp") focusAt(index - 1);
    else if (e.key === "Home") focusAt(0);
    else if (e.key === "End") focusAt(nodes.length - 1);
    else if (e.key === "Tab") close();
  }

  const itemBase =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800";
  const itemClass = `${itemBase} text-zinc-700 dark:text-zinc-200`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${pill} border border-zinc-200 pl-1 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {Icons.account}
        </span>
        <span className="max-w-[8rem] truncate">{user.username}</span>
        <span className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}>{Icons.chevronDown}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Tài khoản"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-zinc-500">
              @{user.username}
              {user.role === "admin" && " · Quản trị"}
            </p>
          </div>
          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" role="separator" />

          {items.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" onClick={close} className={itemClass}>
              <span className="text-zinc-400">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link href="/account" role="menuitem" onClick={close} className={itemClass}>
            <span className="text-zinc-400">{Icons.account}</span>
            Tài khoản
          </Link>

          <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              close();
              await logout(); // stays on the landing page, now signed out
            }}
            className={`${itemBase} text-rose-600 dark:text-rose-400`}
          >
            <span>{Icons.logout}</span>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
