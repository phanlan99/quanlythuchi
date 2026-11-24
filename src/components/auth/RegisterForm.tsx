"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthProvider";
import { PASSWORD_MIN_LENGTH, validateRegister, type FieldErrors, type RegisterInput } from "@/lib/users";
import { errorMessage, Field, FormError, SubmitButton, TextButton } from "./AuthShell";
import type { AuthFormProps } from "./LoginForm";

type Form = RegisterInput & { confirm: string };

const EMPTY: Form = { username: "", password: "", confirm: "", fullName: "", phone: "", address: "" };

export function RegisterForm({ onSwitch, onSuccess }: AuthFormProps) {
  const { register } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Form>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const bind = (name: keyof Form) => ({
    name,
    value: form[name],
    error: errors[name],
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [name]: e.target.value }));
      setErrors((er) => ({ ...er, [name]: undefined }));
    },
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { confirm, ...input } = form;
    const found: FieldErrors<Form> = validateRegister(input);
    if (confirm !== input.password) found.confirm = "Mật khẩu nhập lại không khớp";
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setPending(true);
    setServerError("");
    try {
      onSuccess(await register(input)); // also signs in
    } catch (err) {
      setServerError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Họ và tên" autoComplete="name" autoFocus {...bind("fullName")} />
      <Field
        label="Tên đăng nhập"
        autoComplete="username"
        autoCapitalize="none"
        hint="Chữ thường, số, dấu . hoặc _"
        {...bind("username")}
      />
      <Field label="Số điện thoại" type="tel" autoComplete="tel" {...bind("phone")} />
      <Field label="Địa chỉ (không bắt buộc)" autoComplete="street-address" {...bind("address")} />
      <Field
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
        {...bind("password")}
      />
      <Field label="Nhập lại mật khẩu" type="password" autoComplete="new-password" {...bind("confirm")} />
      <FormError message={serverError} />
      <SubmitButton pending={pending}>Đăng ký</SubmitButton>
      <p className="text-center text-sm text-zinc-500">
        Đã có tài khoản? <TextButton onClick={() => onSwitch("login")}>Đăng nhập</TextButton>
      </p>
    </form>
  );
}
