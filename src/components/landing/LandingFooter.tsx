import Link from "next/link";
import { SECTION_LINKS } from "./content";

const COLUMNS = [
  { title: "Giới thiệu", links: SECTION_LINKS },
  {
    title: "Ứng dụng",
    links: [
      { href: "/dashboard", label: "Tổng quan" },
      { href: "/transactions", label: "Giao dịch" },
      { href: "/budgets", label: "Ngân sách" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { href: "/login", label: "Đăng nhập" },
      { href: "/register", label: "Đăng ký" },
      { href: "/forgot-password", label: "Quên mật khẩu" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4 md:px-6">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">₫</span>
            <span className="text-sm font-semibold">Quản lý chi tiêu</span>
          </Link>
          <p className="text-sm text-zinc-500">Cộng đồng tự quản lý tài chính cá nhân.</p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-zinc-200 py-5 text-center text-xs text-zinc-400 dark:border-zinc-800">
        © 2026 Quản lý chi tiêu
      </div>
    </footer>
  );
}
