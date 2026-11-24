import type { Metadata } from "next";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export const metadata: Metadata = { title: "Đăng ký · Quản lý chi tiêu" };

/** Kept so old links work: opens the register dialog on the landing page. */
export default function RegisterPage() {
  return <AuthRedirect view="register" />;
}
