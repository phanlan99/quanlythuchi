"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { AuthShell, errorMessage, Field, FormError, SubmitButton } from "./AuthShell";

/**
 * Forgot password: the user proves who they are with username + phone number.
 * An admin then sees the request and issues a temporary password, which the
 * user must change on their next login.
 */
export function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !phone.trim()) return setError("Nhập tên đăng nhập và số điện thoại");
    setPending(true);
    setError("");
    try {
      await api.forgotPassword(username, phone);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Quản trị viên sẽ cấp cho bạn mật khẩu tạm thời"
      footer={
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          ← Quay lại đăng nhập
        </Link>
      }
    >
      {sent ? (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-300">
          Nếu thông tin khớp với một tài khoản, yêu cầu đã được gửi tới quản trị viên. Bạn sẽ được liên hệ
          qua số điện thoại đã đăng ký để nhận mật khẩu tạm thời.
        </p>
      ) : (
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
            label="Số điện thoại đã đăng ký"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FormError message={error} />
          <SubmitButton pending={pending}>Gửi yêu cầu</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
