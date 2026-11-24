import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Đăng ký · Quản lý chi tiêu" };

export default function RegisterPage() {
  return <RegisterForm />;
}
