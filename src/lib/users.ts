/**
 * User/account types and validation shared by the browser and the Worker.
 * Keep this file free of `@/` imports — the Worker bundles it directly.
 */

export type Role = "admin" | "user";

/** A user as the API exposes it. Never contains the password hash. */
export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  address: string;
  role: Role;
  locked: boolean;
  /** Set after an admin issues a temporary password; the user must pick a new one. */
  mustChangePassword: boolean;
  /** Unix seconds. */
  createdAt: number;
}

/** A "forgot password" request waiting for an admin. */
export interface ResetRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  phone: string;
  createdAt: number;
}

export interface RegisterInput {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
}

export type ProfileInput = Pick<RegisterInput, "fullName" | "phone" | "address">;

export type AdminUserAction =
  | { type: "setRole"; userId: string; role: Role }
  | { type: "setLocked"; userId: string; locked: boolean }
  | { type: "resetPassword"; userId: string }
  | { type: "delete"; userId: string }
  | { type: "dismissReset"; requestId: string };

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();
export const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function validatePassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) return `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`;
  return undefined;
}

export function validateProfile(input: ProfileInput): FieldErrors<ProfileInput> {
  const errors: FieldErrors<ProfileInput> = {};
  const name = input.fullName.trim();
  if (!name) errors.fullName = "Vui lòng nhập họ tên";
  else if (name.length > 60) errors.fullName = "Họ tên tối đa 60 ký tự";
  if (!/^\+?\d[\d .-]{7,14}$/.test(input.phone.trim())) errors.phone = "Số điện thoại không hợp lệ";
  if (input.address.trim().length > 200) errors.address = "Địa chỉ tối đa 200 ký tự";
  return errors;
}

export function validateRegister(input: RegisterInput): FieldErrors<RegisterInput> {
  const errors: FieldErrors<RegisterInput> = {};
  if (!/^[a-z0-9_.]{3,30}$/.test(normalizeUsername(input.username))) {
    errors.username = "3–30 ký tự: chữ thường, số, dấu . hoặc _";
  }
  const password = validatePassword(input.password);
  if (password) errors.password = password;
  return { ...errors, ...validateProfile(input) };
}

export function firstError<T>(errors: FieldErrors<T>): string | undefined {
  return Object.values(errors).find((e): e is string => typeof e === "string");
}
