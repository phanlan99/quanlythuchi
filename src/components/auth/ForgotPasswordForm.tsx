"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { errorMessage, Field, FormError, SubmitButton, TextButton } from "./AuthShell";
import type { AuthView } from "./auth-dialog-store";

/**
 * Forgot password: the user proves who they are with username + phone number.
 * An admin then sees the request and issues a temporary password, which the
 * user must change on their next login.
 */
export function ForgotPasswordForm({ onSwitch }: { onSwitch: (view: AuthView) => void }) {
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

  const back = (
    <p className="text-center text-sm text-zinc-500">
      <TextButton onClick={() => onSwitch("login")}>← Quay lại đăng nhập</TextButton>
    </p>
  );

  if (sent) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Nếu thông tin khớp với một tài khoản, yêu cầu đã được gửi tới quản trị viên. Bạn sẽ được liên hệ qua số
          điện thoại đã đăng ký để nhận mật khẩu tạm thời.
        </p>
        {back}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field
        label="Tên đăng nhập"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        autoFocus
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
      {back}
    </form>
  );
}
