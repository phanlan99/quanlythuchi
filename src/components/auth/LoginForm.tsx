"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthProvider";
import type { PublicUser } from "@/lib/users";
import type { AuthView } from "./auth-dialog-store";
import { errorMessage, Field, FormError, SubmitButton, TextButton } from "./AuthShell";

export interface AuthFormProps {
  onSwitch: (view: AuthView) => void;
  onSuccess: (user: PublicUser) => void;
}

export function LoginForm({ onSwitch, onSuccess }: AuthFormProps) {
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
      onSuccess(await login(username, password));
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
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
        label="Mật khẩu"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="-mt-2 text-right text-xs">
        <TextButton onClick={() => onSwitch("forgot")}>Quên mật khẩu?</TextButton>
      </div>
      <FormError message={error} />
      <SubmitButton pending={pending}>Đăng nhập</SubmitButton>
      <p className="text-center text-sm text-zinc-500">
        Chưa có tài khoản? <TextButton onClick={() => onSwitch("register")}>Đăng ký</TextButton>
      </p>
    </form>
  );
}
