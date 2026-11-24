import type { Metadata } from "next";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export const metadata: Metadata = { title: "Đăng nhập · Quản lý chi tiêu" };

/** Kept so old links work: opens the login dialog on the landing page. */
export default function LoginPage() {
  return <AuthRedirect view="login" />;
}
