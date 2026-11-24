"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthProvider";
import { PASSWORD_MIN_LENGTH, validateRegister, type FieldErrors, type RegisterInput } from "@/lib/users";
import { AuthShell, errorMessage, Field, FormError, SubmitButton } from "./AuthShell";

type Form = RegisterInput & { confirm: string };

const EMPTY: Form = { username: "", password: "", confirm: "", fullName: "", phone: "", address: "" };

export function RegisterForm() {
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
      await register(input); // signs in; AuthShell then redirects into the app
    } catch (err) {
      setServerError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Mỗi tài khoản quản lý thu chi riêng"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Họ và tên" autoComplete="name" {...bind("fullName")} />
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
      </form>
    </AuthShell>
  );
}
