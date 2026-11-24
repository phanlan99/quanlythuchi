import type { Metadata } from "next";
import Link from "next/link";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";
import { BudgetsView } from "@/components/budgets/BudgetsView";
import { DEFAULT_NAV_ITEMS, Icons } from "@/components/sidebar/nav-config";

export const metadata: Metadata = { title: "Ngân sách · Quản lý chi tiêu" };

/**
 * Example of a page customizing its own sidebar: extra menu item + footer.
 */
export default function BudgetsPage() {
  return (
    <PageWithSidebar
      sidebar={{
        subtitle: "Ngân sách tháng",
        items: [...DEFAULT_NAV_ITEMS, { href: "/welcome", label: "Giới thiệu", icon: Icons.home }],
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
