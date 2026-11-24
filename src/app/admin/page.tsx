import type { Metadata } from "next";
import { AdminUsersView } from "@/components/admin/AdminUsersView";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";

export const metadata: Metadata = { title: "Người dùng · Quản lý chi tiêu" };

export default function AdminPage() {
  return (
    <PageWithSidebar adminOnly sidebar={{ subtitle: "Quản trị" }}>
      <AdminUsersView />
    </PageWithSidebar>
  );
}
