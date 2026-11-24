import type { Metadata } from "next";
import Link from "next/link";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";
import { BudgetsView } from "@/components/budgets/BudgetsView";

export const metadata: Metadata = { title: "Ngân sách · Quản lý chi tiêu" };

/** Example of a page customizing its own sidebar (subtitle + footer). */
export default function BudgetsPage() {
  return (
    <PageWithSidebar
      sidebar={{
        subtitle: "Ngân sách tháng",
        footer: (
          <Link href="/transactions" className="text-xs text-emerald-600 hover:underline">
            + Thêm giao dịch
          </Link>
        ),
      }}
    >
      <BudgetsView />
    </PageWithSidebar>
  );
}
