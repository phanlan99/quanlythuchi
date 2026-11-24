"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthProvider";
import { AuthShell, errorMessage, Field, FormError, SubmitButton } from "./AuthShell";

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !password) return setError("Nhập tên đăng nhập và mật khẩu");
    setPending(true);
    setError("");
    try {
      await login(username, password); // AuthShell then redirects into the app
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Quản lý chi tiêu cá nhân"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline">
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Tên đăng nhập"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Field
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <FormError message={error} />
        <SubmitButton pending={pending}>Đăng nhập</SubmitButton>
      </form>
    </AuthShell>
  );
}
