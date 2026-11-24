/**
 * Database schema, created/upgraded automatically on the first API request.
 *
 * Version 2 (multi-user):
 *   users, sessions, password_resets
 *   categories        (user_id NULL = built-in category shared by everyone)
 *   transactions      (user_id = owner)
 *   user_budget_months, user_budgets (per user)
 *
 * A database created by the earlier single-user version (v1) is upgraded in
 * place: its existing data is tagged LEGACY_OWNER and handed over to the first
 * account that registers (who also becomes admin).
 */
import { DEMO_CATEGORIES } from "../src/lib/demo-data";
import type { D1Database } from "./env";

export const LEGACY_OWNER = "__legacy__";
const SCHEMA_VERSION = 2;

const ACCOUNT_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
     id                   TEXT PRIMARY KEY,
     username             TEXT NOT NULL UNIQUE,
     password_hash        TEXT NOT NULL,
     full_name            TEXT NOT NULL,
     phone                TEXT NOT NULL,
     address              TEXT NOT NULL DEFAULT '',
     role                 TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
     locked               INTEGER NOT NULL DEFAULT 0,
     must_change_password INTEGER NOT NULL DEFAULT 0,
     created_at           INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash TEXT PRIMARY KEY,
     user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at INTEGER NOT NULL,
     created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS password_resets (
     id          TEXT PRIMARY KEY,
     user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
     resolved_at INTEGER
   )`,
  `CREATE TABLE IF NOT EXISTS user_budget_months (
     user_id TEXT NOT NULL,
     month   TEXT NOT NULL,
     PRIMARY KEY (user_id, month)
   )`,
  `CREATE TABLE IF NOT EXISTS user_budgets (
     user_id      TEXT NOT NULL,
     month        TEXT NOT NULL,
     category_id  TEXT NOT NULL REFERENCES categories(id),
     amount_limit INTEGER NOT NULL CHECK (amount_limit >= 0),
     PRIMARY KEY (user_id, month, category_id)
   )`,
];

/** Brand-new database. */
const FRESH = [
  `CREATE TABLE IF NOT EXISTS categories (
     id         TEXT PRIMARY KEY,
     user_id    TEXT,
     name       TEXT NOT NULL,
     icon       TEXT NOT NULL,
     color      TEXT NOT NULL,
     type       TEXT NOT NULL CHECK (type IN ('expense', 'income')),
     created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
   )`,
  `CREATE TABLE IF NOT EXISTS transactions (
     id          TEXT PRIMARY KEY,
     user_id     TEXT NOT NULL,
     type        TEXT NOT NULL CHECK (type IN ('expense', 'income')),
     amount      INTEGER NOT NULL CHECK (amount > 0),
     category_id TEXT NOT NULL REFERENCES categories(id),
     note        TEXT NOT NULL DEFAULT '',
     date        TEXT NOT NULL,
     created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
   )`,
  ...ACCOUNT_TABLES,
];

/** Upgrade from the single-user v1 schema (keeps all existing data). */
const FROM_V1 = [
  `ALTER TABLE categories ADD COLUMN user_id TEXT`,
  `UPDATE categories SET user_id = '${LEGACY_OWNER}' WHERE id LIKE 'custom-%'`,
  `ALTER TABLE transactions ADD COLUMN user_id TEXT NOT NULL DEFAULT '${LEGACY_OWNER}'`,
  ...ACCOUNT_TABLES,
  `INSERT OR IGNORE INTO user_budget_months (user_id, month)
     SELECT '${LEGACY_OWNER}', month FROM budget_months`,
  `INSERT OR IGNORE INTO user_budgets (user_id, month, category_id, amount_limit)
     SELECT '${LEGACY_OWNER}', month, category_id, amount_limit FROM budgets`,
  `DROP TABLE budgets`,
  `DROP TABLE budget_months`,
];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date)`,
];

async function migrate(db: D1Database): Promise<void> {
  await db.prepare("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
  const row = await db
    .prepare("SELECT value FROM meta WHERE key = 'schema_version'")
    .first<{ value: string }>();
  if (row && Number(row.value) >= SCHEMA_VERSION) return;

  const isV1 = await db
    .prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = 'budget_months'")
    .first();

  const seed = DEMO_CATEGORIES.map((c) =>
    db
      .prepare(
        "INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, type) VALUES (?, NULL, ?, ?, ?, ?)",
      )
      .bind(c.id, c.name, c.icon, c.color, c.type),
  );

  // One batch = one transaction: the upgrade either fully applies or not at all.
  await db.batch([
    ...(isV1 ? FROM_V1 : FRESH).map((sql) => db.prepare(sql)),
    ...INDEXES.map((sql) => db.prepare(sql)),
    ...seed,
    db
      .prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)")
      .bind(String(SCHEMA_VERSION)),
  ]);
}

// Checked once per Worker instance; retried on the next request if it fails.
let ready: Promise<void> | null = null;

export function ensureSchema(db: D1Database): Promise<void> {
  ready ??= migrate(db).catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
