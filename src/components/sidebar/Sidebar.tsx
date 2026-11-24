"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useOverlay } from "@/hooks/use-overlay";
import { ADMIN_NAV_ITEMS, DEFAULT_NAV_ITEMS, Icons, type NavItem } from "./nav-config";
import { UserCard } from "./UserCard";

export interface SidebarProps {
  /** Menu entries. Defaults to the app's main navigation. */
  items?: NavItem[];
  title?: string;
  subtitle?: string;
  /** Extra content pinned to the bottom (e.g. user card, actions). */
  footer?: ReactNode;
  /** Allow shrinking to icons-only on desktop. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Standalone sidebar. It is NOT mounted in the layout — each page decides
 * whether to render it (directly or via <PageWithSidebar>).
 *
 * - Desktop (md+): sticky column, optionally collapsible.
 * - Mobile: top bar with a menu button that opens a drawer.
 */
export function Sidebar({
  items: pageItems = DEFAULT_NAV_ITEMS,
  title = "Quản lý chi tiêu",
  subtitle = "Tài chính cá nhân",
  footer,
  collapsible = true,
  defaultCollapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Admins always get the user-management and data entries.
  const items = user?.role === "admin" ? [...pageItems, ...ADMIN_NAV_ITEMS] : pageItems;

  // Close the mobile drawer with Escape and lock body scroll while open.
  useOverlay(mobileOpen, () => setMobileOpen(false));

  const nav = (isCollapsed: boolean) => (
    <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      active ? "bg-white/20" : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const brand = (isCollapsed: boolean) => (
    <div className="flex items-center gap-3">
      <Link
        href="/"
        aria-label="Trang giới thiệu"
        title="Trang giới thiệu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-lg text-white"
      >
        ₫
      </Link>
      {!isCollapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ---------- Mobile top bar ---------- */}
      {/* Fixed 56px height (h-14) — PageHeader sticks right below it on mobile. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
        {brand(false)}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
          className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {Icons.menu}
        </button>
      </header>

      {/* ---------- Mobile drawer ---------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
              {brand(false)}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {Icons.close}
              </button>
            </div>
            {nav(false)}
            {footer && (
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">{footer}</div>
            )}
            <div className="border-t border-zinc-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-zinc-800">
              <UserCard onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* ---------- Desktop sidebar ---------- */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 md:flex dark:border-zinc-800 dark:bg-zinc-950 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`flex h-14 shrink-0 items-center border-b border-zinc-200 px-4 dark:border-zinc-800 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {brand(collapsed)}
        </div>

        {nav(collapsed)}

        {footer && !collapsed && (
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">{footer}</div>
        )}

        <div className={`border-t border-zinc-200 dark:border-zinc-800 ${collapsed ? "" : "p-3"}`}>
          <UserCard compact={collapsed} />
        </div>

        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            className="flex items-center justify-center gap-2 border-t border-zinc-200 py-3 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            {collapsed ? Icons.chevronRight : Icons.chevronLeft}
            {!collapsed && <span>Thu gọn</span>}
          </button>
        )}
      </aside>
    </>
  );
}
