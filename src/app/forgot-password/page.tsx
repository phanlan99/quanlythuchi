import type { Metadata } from "next";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export const metadata: Metadata = { title: "Quên mật khẩu · Quản lý chi tiêu" };

/** Kept so old links work: opens the forgot-password dialog on the landing page. */
export default function ForgotPasswordPage() {
  return <AuthRedirect view="forgot" />;
}
