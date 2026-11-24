import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Giới thiệu · Quản lý chi tiêu" };

/** Example of a page WITHOUT the sidebar — it simply doesn't render one. */
export default function WelcomePage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white">
          ₫
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Quản lý chi tiêu</h1>
        <p className="mt-3 text-zinc-500">
          Theo dõi thu chi hằng ngày, đặt ngân sách cho từng danh mục và xem tổng quan tài chính
          mỗi tháng.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Bắt đầu
        </Link>
      </div>
    </main>
  );
}
