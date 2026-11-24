import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Đăng nhập · Quản lý chi tiêu" };

export default function LoginPage() {
  return <LoginForm />;
}
