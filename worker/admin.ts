/** Admin-only routes: list users, change role, lock, issue temporary password, delete. */
import type { ResetRequest } from "../src/lib/users";
import { generateTempPassword, hashPassword, toPublicUser, USER_COLUMNS, type Session, type UserRow } from "./auth";
import { HttpError, json, nowSeconds, readJson, str, type D1Database } from "./env";

export async function listUsers(db: D1Database): Promise<Response> {
  const [users, resets] = await db.batch([
    db.prepare(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC`),
    db.prepare(
      `SELECT r.id, r.user_id, r.created_at, u.username, u.full_name, u.phone
       FROM password_resets r JOIN users u ON u.id = r.user_id
       WHERE r.resolved_at IS NULL ORDER BY r.created_at`,
    ),
  ]);

  type ResetRow = { id: string; user_id: string; created_at: number; username: string; full_name: string; phone: string };
  return json({
    users: (users.results as UserRow[]).map(toPublicUser),
    resetRequests: (resets.results as ResetRow[]).map(
      (r): ResetRequest => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        fullName: r.full_name,
        phone: r.phone,
        createdAt: r.created_at,
      }),
    ),
  });
}

export async function adminAction(db: D1Database, request: Request, session: Session): Promise<Response> {
  const body = await readJson(request);
  const type = str(body.type);

  if (type === "dismissReset") {
    await db
      .prepare("UPDATE password_resets SET resolved_at = ? WHERE id = ?")
      .bind(nowSeconds(), str(body.requestId))
      .run();
    return json({ ok: true });
  }

  const userId = str(body.userId);
  // Admins manage their own account from the Account page, and can't lock
  // themselves out — so there is always at least one active admin.
  if (userId === session.user.id) throw new HttpError(400, "Không thể thao tác trên tài khoản của chính bạn");
  const target = await db.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first();
  if (!target) throw new HttpError(404, "Không tìm thấy người dùng");

  switch (type) {
    case "setRole": {
      const role = str(body.role);
      if (role !== "admin" && role !== "user") throw new HttpError(400, "Vai trò không hợp lệ");
      await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
      return json({ ok: true });
    }
    case "setLocked": {
      const locked = body.locked === true;
      await db.batch([
        db.prepare("UPDATE users SET locked = ? WHERE id = ?").bind(locked ? 1 : 0, userId),
        ...(locked ? [db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId)] : []),
      ]);
      return json({ ok: true });
    }
    case "resetPassword": {
      // Shown to the admin once, never stored in readable form; the user must change it at next login.
      const tempPassword = generateTempPassword();
      await db.batch([
        db
          .prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?")
          .bind(await hashPassword(tempPassword), userId),
        db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
        db
          .prepare("UPDATE password_resets SET resolved_at = ? WHERE user_id = ? AND resolved_at IS NULL")
          .bind(nowSeconds(), userId),
      ]);
      return json({ ok: true, tempPassword });
    }
    case "delete":
      // Children first (foreign keys): budgets → months → transactions → categories → user.
      await db.batch(
        [
          "DELETE FROM user_budgets WHERE user_id = ?",
          "DELETE FROM user_budget_months WHERE user_id = ?",
          "DELETE FROM transactions WHERE user_id = ?",
          "DELETE FROM categories WHERE user_id = ?",
          "DELETE FROM sessions WHERE user_id = ?",
          "DELETE FROM password_resets WHERE user_id = ?",
          "DELETE FROM users WHERE id = ?",
        ].map((sql) => db.prepare(sql).bind(userId)),
      );
      return json({ ok: true });
    default:
      throw new HttpError(400, "Unknown action");
  }
}
