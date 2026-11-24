import type { Metadata } from "next";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export const metadata: Metadata = { title: "Giao dịch · Quản lý chi tiêu" };

export default function TransactionsPage() {
  return (
    <PageWithSidebar>
      <TransactionsView />
    </PageWithSidebar>
  );
}
