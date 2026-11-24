import type { Metadata } from "next";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = { title: "Tổng quan · Quản lý chi tiêu" };

export default function DashboardPage() {
  return (
    <PageWithSidebar>
      <DashboardView />
    </PageWithSidebar>
  );
}
