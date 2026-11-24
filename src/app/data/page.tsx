import type { Metadata } from "next";
import { DataView } from "@/components/admin/DataView";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";

export const metadata: Metadata = { title: "Dữ liệu · Quản lý chi tiêu" };

export default function DataPage() {
  return (
    <PageWithSidebar adminOnly sidebar={{ subtitle: "Quản trị" }}>
      <DataView />
    </PageWithSidebar>
  );
}
