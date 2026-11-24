import type { PersistedAction, RemoteState } from "./actions";
import type { TableInfo, TableRows } from "./admin-data";
import type { AdminUserAction, ProfileInput, PublicUser, RegisterInput, ResetRequest } from "./users";

/** The server answered with an error (message is user-facing Vietnamese text). */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * The API isn't there at all (e.g. `next dev`, where only the static app runs).
 * The app then switches to demo mode.
 */
export class ApiUnavailableError extends Error {}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    throw new ApiUnavailableError("Không kết nối được máy chủ");
  }
  if (!res.headers.get("content-type")?.includes("application/json")) {
    throw new ApiUnavailableError("API không khả dụng");
  }
  const data = (await res.json()) as { error?: string; code?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Lỗi ${res.status}`, data.code);
  return data as T;
}

type UserResponse = { user: PublicUser };

export const api = {
  me: () => request<UserResponse>("/api/auth/me"),
  login: (username: string, password: string) =>
    request<UserResponse>("/api/auth/login", { username, password }),
  register: (input: RegisterInput) => request<UserResponse>("/api/auth/register", input),
  logout: () => request<{ ok: true }>("/api/auth/logout", {}),
  forgotPassword: (username: string, phone: string) =>
    request<{ ok: true }>("/api/auth/forgot", { username, phone }),

  updateProfile: (input: ProfileInput) => request<UserResponse>("/api/account/profile", input),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<UserResponse>("/api/account/password", { currentPassword, newPassword }),

  state: () => request<RemoteState>("/api/state"),

  adminUsers: () =>
    request<{ users: PublicUser[]; resetRequests: ResetRequest[] }>("/api/admin/users"),
  adminAction: (action: AdminUserAction) =>
    request<{ ok: true; tempPassword?: string }>("/api/admin/users", action),

  adminTables: () => request<{ tables: TableInfo[] }>("/api/admin/tables"),
  adminTableRows: (table: string, page: number) =>
    request<TableRows>(`/api/admin/tables?table=${encodeURIComponent(table)}&page=${page}`),
};

// Actions are sent strictly one after another, so dependent writes
// (e.g. create a category, then budget it) reach D1 in order.
let queue: Promise<unknown> = Promise.resolve();

export function sendAction(action: PersistedAction): Promise<void> {
  const sent = queue.then(() => request<{ ok: true }>("/api/actions", action)).then(() => {});
  queue = sent.catch(() => {}); // a failure must not block later writes
  return sent;
}
