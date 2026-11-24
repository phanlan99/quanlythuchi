"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "@/hooks/use-overlay";
import { Icons } from "@/components/sidebar/nav-config";
import { openAuthDialog } from "@/components/auth/auth-dialog-store";
import { searchSite, type SearchItem } from "./content";

/**
 * Site search (pages, features, FAQ). Accent-insensitive: "ngan sach" finds "Ngân sách".
 * Mount only while open. Portaled to <body> so the blurred sticky navbar
 * doesn't trap its fixed positioning.
 */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  useOverlay(true, onClose);

  const results = searchSite(query);
  const current = Math.min(active, results.length - 1);

  function go(item: SearchItem) {
    onClose();
    if (item.auth) openAuthDialog(item.auth);
    else router.push(item.href);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter" && results[current]) {
      e.preventDefault();
      go(results[current]);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <span className="text-zinc-400">{Icons.search}</span>
          <input
            autoFocus
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results[current] ? `${listId}-${current}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm trang, tính năng, câu hỏi…"
            className="h-14 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:block dark:border-zinc-700">
            Esc
          </kbd>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">Không tìm thấy kết quả</p>
        ) : (
          <ul id={listId} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {results.map((item, i) => (
              <li key={`${item.href}-${item.title}`} id={`${listId}-${i}`} role="option" aria-selected={i === current}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
                    i === current ? "bg-zinc-100 dark:bg-zinc-800" : ""
                  }`}
                >
                  <span className="mt-0.5 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
                    {item.group}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-zinc-500">{item.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
