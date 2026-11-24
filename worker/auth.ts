/**
 * Accounts: password hashing, cookie sessions and the /api/auth + /api/account routes.
 *
 * Passwords are stored only as salted PBKDF2-SHA256 hashes (Web Crypto, built
 * into Workers). Nobody — including admins — can read a user's password; an
 * admin can instead issue a one-time temporary password (see admin.ts).
 */
import {
  digitsOnly,
  firstError,
  normalizeUsername,
  validatePassword,
  validateProfile,
  validateRegister,
  type PublicUser,
  type RegisterInput,
  type Role,
} from "../src/lib/users";
import { HttpError, json, nowSeconds, readJson, str, type D1Database } from "./env";
import { LEGACY_OWNER } from "./schema";

/* ------------------------------ Password hashing ----------------------------- */

const PBKDF2_ITERATIONS = 100_000; // the maximum Workers allows
const encoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function pbkdf2(password: string, salt: BufferSource, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || !salt || !hash) return false;
  const actual = await pbkdf2(password, fromBase64(salt), Number(iterations));
  return constantTimeEqual(actual, fromBase64(hash));
}

/** Readable one-time password, e.g. "K7PM-QX3A-9TRD" (32-letter alphabet → no modulo bias). */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

/* ---------------------------------- Users ------------------------------------ */

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  phone: string;
  address: string;
  role: Role;
  locked: number;
  must_change_password: number;
  created_at: number;
}

export const USER_COLUMNS =
  "id, username, full_name, phone, address, role, locked, must_change_password, created_at";

export function toPublicUser(row: Omit<UserRow, "password_hash">): PublicUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    role: row.role,
    locked: row.locked === 1,
    mustChangePassword: row.must_change_password === 1,
    createdAt: row.created_at,
  };
}

/* --------------------------------- Sessions ---------------------------------- */

const COOKIE_NAME = "qlct_session";
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days

async function sha256(text: string): Promise<string> {
  return toBase64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text))));
}

function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=") || null;
  }
  return null;
}

const sessionCookie = (token: string, maxAge: number) =>
  `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

/** Store a new session (only the token's hash is saved) and return the Set-Cookie value. */
async function startSession(db: D1Database, userId: string): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = nowSeconds();
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
    db
      .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(await sha256(token), userId, now + SESSION_TTL),
  ]);
  return sessionCookie(token, SESSION_TTL);
}

export interface Session {
  user: UserRow;
  tokenHash: string;
}

/** The signed-in, unlocked user for this request, or null. */
export async function getSession(db: D1Database, request: Request): Promise<Session | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.locked = 0`,
    )
    .bind(tokenHash, nowSeconds())
    .first<UserRow>();
  return user ? { user, tokenHash } : null;
}

/* ---------------------------------- Routes ----------------------------------- */

export async function register(db: D1Database, request: Request): Promise<Response> {
  const body = await readJson(request);
  const input: RegisterInput = {
    username: normalizeUsername(str(body.username)),
    password: str(body.password),
    fullName: str(body.fullName).trim(),
    phone: str(body.phone).trim(),
    address: str(body.address).trim(),
  };
  const error = firstError(validateRegister(input));
  if (error) throw new HttpError(400, error);

  const taken = await db.prepare("SELECT 1 AS found FROM users WHERE username = ?").bind(input.username).first();
  if (taken) throw new HttpError(409, "Tên đăng nhập đã được sử dụng");

  const id = crypto.randomUUID();
  const isAdmin = "(SELECT role FROM users WHERE id = ?) = 'admin'";
  try {
    await db.batch([
      // The very first account becomes admin (decided atomically inside SQL).
      db
        .prepare(
          `INSERT INTO users (id, username, password_hash, full_name, phone, address, role)
           VALUES (?, ?, ?, ?, ?, ?,
                   CASE WHEN EXISTS (SELECT 1 FROM users) THEN 'user' ELSE 'admin' END)`,
        )
        .bind(id, input.username, await hashPassword(input.password), input.fullName, input.phone, input.address),
      // Data from the old single-user version goes to that first admin.
      ...["transactions", "categories", "user_budget_months", "user_budgets"].map((table) =>
        db
          .prepare(`UPDATE ${table} SET user_id = ? WHERE user_id = '${LEGACY_OWNER}' AND ${isAdmin}`)
          .bind(id, id),
      ),
    ]);
  } catch (err) {
    if (String(err).includes("UNIQUE")) throw new HttpError(409, "Tên đăng nhập đã được sử dụng");
    throw err;
  }

  const user = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(id).first<UserRow>();
  return json({ user: toPublicUser(user!) }, 201, { "Set-Cookie": await startSession(db, id) });
}

export async function login(db: D1Database, request: Request): Promise<Response> {
  const body = await readJson(request);
  const username = normalizeUsername(str(body.username));
  const password = str(body.password);

  const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first<UserRow>();
  let ok = false;
  if (user) ok = await verifyPassword(password, user.password_hash);
  else await hashPassword(password); // same work either way: timing doesn't reveal valid usernames
  if (!user || !ok) throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu");
  if (user.locked) throw new HttpError(403, "Tài khoản đã bị khoá. Liên hệ quản trị viên.");

  return json({ user: toPublicUser(user) }, 200, { "Set-Cookie": await startSession(db, user.id) });
}

export async function logout(db: D1Database, request: Request): Promise<Response> {
  const token = readSessionToken(request);
  if (token) await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}

/**
 * "Forgot password": records a request for an admin when username + phone match.
 * Always answers the same way so it can't be used to probe accounts.
 */
export async function forgotPassword(db: D1Database, request: Request): Promise<Response> {
  const body = await readJson(request);
  const user = await db
    .prepare("SELECT id, phone FROM users WHERE username = ?")
    .bind(normalizeUsername(str(body.username)))
    .first<{ id: string; phone: string }>();

  const phone = digitsOnly(str(body.phone));
  if (user && phone && digitsOnly(user.phone) === phone) {
    await db
      .prepare(
        `INSERT INTO password_resets (id, user_id)
         SELECT ?, ? WHERE NOT EXISTS
           (SELECT 1 FROM password_resets WHERE user_id = ? AND resolved_at IS NULL)`,
      )
      .bind(crypto.randomUUID(), user.id, user.id)
      .run();
  }
  return json({ ok: true });
}

export async function updateProfile(db: D1Database, request: Request, session: Session): Promise<Response> {
  const body = await readJson(request);
  const input = {
    fullName: str(body.fullName).trim(),
    phone: str(body.phone).trim(),
    address: str(body.address).trim(),
  };
  const error = firstError(validateProfile(input));
  if (error) throw new HttpError(400, error);

  const user = await db
    .prepare(`UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ? RETURNING ${USER_COLUMNS}`)
    .bind(input.fullName, input.phone, input.address, session.user.id)
    .first<UserRow>();
  return json({ user: toPublicUser(user!) });
}

export async function changePassword(db: D1Database, request: Request, session: Session): Promise<Response> {
  const body = await readJson(request);
  const current = str(body.currentPassword);
  const next = str(body.newPassword);

  if (!(await verifyPassword(current, session.user.password_hash))) {
    throw new HttpError(400, "Mật khẩu hiện tại không đúng");
  }
  const error = validatePassword(next);
  if (error) throw new HttpError(400, error);
  if (next === current) throw new HttpError(400, "Mật khẩu mới phải khác mật khẩu hiện tại");

  const [, updated] = await db.batch<UserRow>([
    // Sign out every other device.
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").bind(session.user.id, session.tokenHash),
    db
      .prepare(
        `UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ? RETURNING ${USER_COLUMNS}`,
      )
      .bind(await hashPassword(next), session.user.id),
  ]);
  return json({ user: toPublicUser(updated.results[0]) });
}
