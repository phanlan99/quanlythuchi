"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthProvider";
import { api } from "@/lib/api";
import { validatePassword, validateProfile, type FieldErrors, type ProfileInput } from "@/lib/users";
import { errorMessage, Field, FormError } from "@/components/auth/AuthShell";
import { Card, PageHeader } from "@/components/ui";

const saveButton =
  "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";

export function AccountView() {
  const { user, status } = useAuth();

  if (status !== "authenticated" || !user) {
    return (
      <>
        <PageHeader title="Tài khoản" />
        <p className="text-sm text-zinc-500">Cần đăng nhập (chạy qua Cloudflare) để quản lý tài khoản.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tài khoản" />
      {user.mustChangePassword && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          Bạn đang dùng mật khẩu tạm thời. Hãy đặt mật khẩu mới để tiếp tục.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* key: re-seed the form if the user object is replaced */}
        {!user.mustChangePassword && <ProfileCard key={user.id} />}
        <PasswordCard />
      </div>
    </>
  );
}

function ProfileCard() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState<ProfileInput>({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<ProfileInput>>({});
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const bind = (name: keyof ProfileInput) => ({
    name,
    value: form[name],
    error: errors[name],
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [name]: e.target.value }));
      setErrors((er) => ({ ...er, [name]: undefined }));
      setMessage("");
    },
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateProfile(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setPending(true);
    setServerError("");
    try {
      setUser((await api.updateProfile(form)).user);
      setMessage("Đã lưu");
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title="Thông tin cá nhân">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Tên đăng nhập" name="username" value={user?.username ?? ""} disabled readOnly />
        <Field label="Họ và tên" autoComplete="name" {...bind("fullName")} />
        <Field label="Số điện thoại" type="tel" autoComplete="tel" {...bind("phone")} />
        <Field label="Địa chỉ" autoComplete="street-address" {...bind("address")} />
        <FormError message={serverError} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={saveButton}>
            {pending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
          {message && (
            <span role="status" className="text-sm text-emerald-600">
              {message}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

type PasswordForm = { current: string; next: string; confirm: string };

function PasswordCard() {
  const { setUser } = useAuth();
  const [form, setForm] = useState<PasswordForm>({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors<PasswordForm>>({});
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const bind = (name: keyof PasswordForm) => ({
    name,
    type: "password",
    value: form[name],
    error: errors[name],
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [name]: e.target.value }));
      setErrors((er) => ({ ...er, [name]: undefined }));
      setMessage("");
    },
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found: FieldErrors<PasswordForm> = {};
    if (!form.current) found.current = "Nhập mật khẩu hiện tại";
    const nextError = validatePassword(form.next);
    if (nextError) found.next = nextError;
    if (form.confirm !== form.next) found.confirm = "Mật khẩu nhập lại không khớp";
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setPending(true);
    setServerError("");
    try {
      const { user } = await api.changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setMessage("Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.");
      setUser(user);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title="Đổi mật khẩu">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Mật khẩu hiện tại" autoComplete="current-password" {...bind("current")} />
        <Field label="Mật khẩu mới" autoComplete="new-password" {...bind("next")} />
        <Field label="Nhập lại mật khẩu mới" autoComplete="new-password" {...bind("confirm")} />
        <FormError message={serverError} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={saveButton}>
            {pending ? "Đang lưu…" : "Đổi mật khẩu"}
          </button>
          {message && (
            <span role="status" className="text-sm text-emerald-600">
              {message}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
