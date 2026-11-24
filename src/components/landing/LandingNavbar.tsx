"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icons } from "@/components/sidebar/nav-config";
import { AccountMenu } from "./AccountMenu";
import { SECTION_LINKS } from "./content";
import { SearchDialog } from "./SearchDialog";

/** Sticky top bar: brand, section links, search (also Ctrl/⌘ + K), account. */
export function LandingNavbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">₫</span>
          <span className="text-sm font-semibold tracking-tight">Quản lý chi tiêu</span>
        </Link>

        <nav aria-label="Trang giới thiệu" className="hidden items-center gap-6 md:flex">
          {SECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Tìm kiếm"
            title="Tìm kiếm (Ctrl + K)"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {Icons.search}
          </button>
          <AccountMenu />
        </div>
      </div>

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
