import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";
import { PageWithSidebar } from "@/components/layout/PageWithSidebar";

export const metadata: Metadata = { title: "Tài khoản · Quản lý chi tiêu" };

export default function AccountPage() {
  return (
    <PageWithSidebar allowPasswordChange>
      <AccountView />
    </PageWithSidebar>
  );
}
