/**
 * Cloudflare Worker: serves the static Next.js export (./out) and a JSON API backed by D1.
 *
 * Public
 *   POST /api/auth/register   create account (first account = admin) + sign in
 *   POST /api/auth/login      sign in (HttpOnly session cookie)
 *   POST /api/auth/logout
 *   POST /api/auth/forgot     ask an admin for a temporary password
 * Signed in
 *   GET  /api/auth/me         current user
 *   POST /api/account/profile update name / phone / address
 *   POST /api/account/password
 *   GET  /api/state           the user's transactions, categories, budgets, months
 *   POST /api/actions         apply one PersistedAction for the user
 * Admin
 *   GET  /api/admin/users     users + pending password requests
 *   POST /api/admin/users     setRole | setLocked | resetPassword | delete | dismissReset
 *   GET  /api/admin/tables    table structures (+ ?table=x&page=n for rows), read-only
 *
 * Tables are created/upgraded automatically on the first request (schema.ts).
 * Only relative imports here (no `@/`): wrangler bundles these files directly.
 */
import { adminAction, listUsers } from "./admin";
import { listTables, tableRows } from "./admin-data";
import {
  changePassword,
  forgotPassword,
  getSession,
  login,
  logout,
  register,
  toPublicUser,
  updateProfile,
} from "./auth";
import { HttpError, json, type D1Database, type Env } from "./env";
import { applyAction, getState } from "./expenses";
import { ensureSchema } from "./schema";

async function route(db: D1Database, request: Request, url: URL): Promise<Response> {
  const path = url.pathname;
  const post = request.method === "POST";
  const get = request.method === "GET";

  // ---- Public ----
  if (post && path === "/api/auth/register") return register(db, request);
  if (post && path === "/api/auth/login") return login(db, request);
  if (post && path === "/api/auth/logout") return logout(db, request);
  if (post && path === "/api/auth/forgot") return forgotPassword(db, request);

  // ---- Signed in ----
  const session = await getSession(db, request);
  if (!session) throw new HttpError(401, "Chưa đăng nhập", "unauthenticated");

  if (get && path === "/api/auth/me") return json({ user: toPublicUser(session.user) });
  if (post && path === "/api/account/password") return changePassword(db, request, session);

  // After an admin reset, nothing else works until the user picks a new password.
  if (session.user.must_change_password) {
    throw new HttpError(403, "Vui lòng đổi mật khẩu tạm thời", "must_change_password");
  }

  if (post && path === "/api/account/profile") return updateProfile(db, request, session);
  if (get && path === "/api/state") return getState(db, session.user.id);
  if (post && path === "/api/actions") return applyAction(db, request, session.user.id);

  // ---- Admin ----
  if (path.startsWith("/api/admin/")) {
    if (session.user.role !== "admin") throw new HttpError(403, "Chỉ dành cho quản trị viên");
    if (path === "/api/admin/users" && get) return listUsers(db);
    if (path === "/api/admin/users" && post) return adminAction(db, request, session);
    if (path === "/api/admin/tables" && get) {
      return url.searchParams.has("table") ? tableRows(db, url) : listTables(db);
    }
  }

  throw new HttpError(404, "Not found");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Everything that isn't the API is the static app.
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    try {
      await ensureSchema(env.DB);
      return await route(env.DB, request, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status);
      console.error(err);
      return json({ error: "Lỗi máy chủ" }, 500);
    }
  },
};
