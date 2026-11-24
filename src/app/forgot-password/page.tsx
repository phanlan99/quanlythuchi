import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Quên mật khẩu · Quản lý chi tiêu" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
