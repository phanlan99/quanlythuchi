/**
 * Cloudflare Worker: serves the static Next.js export (./out) and a tiny
 * JSON API backed by D1.
 *
 *   GET  /api/state    -> everything (transactions, categories, budgets, months)
 *   POST /api/actions  -> apply one PersistedAction (same shape the UI reducer uses)
 *
 * Tables are created automatically on first request (CREATE TABLE IF NOT EXISTS),
 * and the built-in categories are seeded — no manual SQL or migrations needed.
 *
 * Only relative imports here (no `@/`): wrangler bundles this file directly.
 */
import type { PersistedAction, RemoteState } from "../src/lib/actions";
import { DEMO_CATEGORIES } from "../src/lib/demo-data";
import type { Budget, Category, Transaction, TransactionType } from "../src/lib/types";

/* ---------- Minimal D1 / Worker types (avoids an extra dependency) ---------- */

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
}
interface D1Result<T> {
  results: T[];
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/* ---------------------------------- Schema ---------------------------------- */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS categories (
     id         TEXT PRIMARY KEY,
     name       TEXT NOT NULL,
     icon       TEXT NOT NULL,
     color      TEXT NOT NULL,
     type       TEXT NOT NULL CHECK (type IN ('expense', 'income')),
     created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
   )`,
  `CREATE TABLE IF NOT EXISTS transactions (
     id          TEXT PRIMARY KEY,
     type        TEXT NOT NULL CHECK (type IN ('expense', 'income')),
     amount      INTEGER NOT NULL CHECK (amount > 0),
     category_id TEXT NOT NULL REFERENCES categories(id),
     note        TEXT NOT NULL DEFAULT '',
     date        TEXT NOT NULL,
     created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
  `CREATE TABLE IF NOT EXISTS budget_months (
     month TEXT PRIMARY KEY
   )`,
  `CREATE TABLE IF NOT EXISTS budgets (
     month        TEXT NOT NULL REFERENCES budget_months(month) ON DELETE CASCADE,
     category_id  TEXT NOT NULL REFERENCES categories(id),
     amount_limit INTEGER NOT NULL CHECK (amount_limit >= 0),
     PRIMARY KEY (month, category_id)
   )`,
];

// Run the schema once per Worker instance (cheap: all statements are IF NOT EXISTS).
let schemaReady: Promise<void> | null = null;

function ensureSchema(db: D1Database): Promise<void> {
  schemaReady ??= (async () => {
    const seed = DEMO_CATEGORIES.map((c) =>
      db
        .prepare("INSERT OR IGNORE INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)")
        .bind(c.id, c.name, c.icon, c.color, c.type),
    );
    await db.batch([...SCHEMA.map((sql) => db.prepare(sql)), ...seed]);
  })().catch((err) => {
    schemaReady = null; // retry on next request
    throw err;
  });
  return schemaReady;
}

/* ---------------------------------- Reads ----------------------------------- */

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  note: string;
  date: string;
}
interface BudgetRow {
  month: string;
  category_id: string;
  amount_limit: number;
}

async function loadState(db: D1Database): Promise<RemoteState> {
  const [cats, txs, months, budgets] = await db.batch([
    db.prepare("SELECT id, name, icon, color, type FROM categories ORDER BY created_at, rowid"),
    db.prepare(
      "SELECT id, type, amount, category_id, note, date FROM transactions ORDER BY date DESC, created_at DESC",
    ),
    db.prepare("SELECT month FROM budget_months ORDER BY month DESC"),
    db.prepare("SELECT month, category_id, amount_limit FROM budgets"),
  ]);

  return {
    categories: cats.results as Category[],
    transactions: (txs.results as TransactionRow[]).map(
      (r): Transaction => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        categoryId: r.category_id,
        note: r.note,
        date: r.date,
      }),
    ),
    budgetMonths: (months.results as { month: string }[]).map((r) => r.month),
    budgets: (budgets.results as BudgetRow[]).map(
      (r): Budget => ({ month: r.month, categoryId: r.category_id, limit: r.amount_limit }),
    ),
  };
}

/* ------------------------------- Validation --------------------------------- */

class ValidationError extends Error {}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ValidationError(message);
}

const isId = (v: unknown): v is string => typeof v === "string" && /^[\w-]{1,80}$/.test(v);
const isMonth = (v: unknown): v is string => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isType = (v: unknown): v is TransactionType => v === "expense" || v === "income";
const isAmount = (v: unknown, min: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= 1e13;

function checkTransactionFields(t: Record<string, unknown>) {
  check(isType(t.type), "Invalid type");
  check(isAmount(t.amount, 1), "Invalid amount");
  check(isId(t.categoryId), "Invalid category");
  check(typeof t.note === "string" && t.note.length <= 120, "Invalid note");
  check(isDate(t.date), "Invalid date");
}

/** Validate untrusted JSON and narrow it to a PersistedAction. */
function parseAction(raw: unknown): PersistedAction {
  check(raw && typeof raw === "object", "Body must be an object");
  const a = raw as Record<string, unknown>;

  switch (a.type) {
    case "add": {
      const t = a.transaction as Record<string, unknown> | undefined;
      check(t && typeof t === "object" && isId(t.id), "Invalid transaction");
      checkTransactionFields(t);
      return a as PersistedAction;
    }
    case "update": {
      const input = a.input as Record<string, unknown> | undefined;
      check(isId(a.id) && input && typeof input === "object", "Invalid update");
      checkTransactionFields(input);
      return a as PersistedAction;
    }
    case "remove":
      check(isId(a.id), "Invalid id");
      return a as PersistedAction;
    case "addCategory": {
      const c = a.category as Record<string, unknown> | undefined;
      check(c && typeof c === "object" && isId(c.id), "Invalid category");
      check(typeof c.name === "string" && c.name.trim().length > 0 && c.name.length <= 30, "Invalid name");
      check(typeof c.icon === "string" && c.icon.length > 0 && c.icon.length <= 16, "Invalid icon");
      check(typeof c.color === "string" && /^#[0-9a-f]{6}$/i.test(c.color), "Invalid color");
      check(isType(c.type), "Invalid type");
      return a as PersistedAction;
    }
    case "setBudget":
      check(isMonth(a.month) && isId(a.categoryId) && isAmount(a.limit, 0), "Invalid budget");
      return a as PersistedAction;
    case "removeBudget":
      check(isMonth(a.month) && isId(a.categoryId), "Invalid budget");
      return a as PersistedAction;
    case "createBudgetMonth":
      check(isMonth(a.month) && (a.copyFrom === null || isMonth(a.copyFrom)), "Invalid month");
      return a as PersistedAction;
    default:
      throw new ValidationError("Unknown action");
  }
}

/* --------------------------------- Writes ----------------------------------- */

/** Turn an action into SQL. Statements run in one D1 batch (= one transaction). */
function toStatements(db: D1Database, action: PersistedAction): D1PreparedStatement[] {
  switch (action.type) {
    case "add": {
      const t = action.transaction;
      return [
        db
          .prepare(
            "INSERT INTO transactions (id, type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?, ?)",
          )
          .bind(t.id, t.type, t.amount, t.categoryId, t.note, t.date),
      ];
    }
    case "update": {
      const i = action.input;
      return [
        db
          .prepare(
            "UPDATE transactions SET type = ?, amount = ?, category_id = ?, note = ?, date = ? WHERE id = ?",
          )
          .bind(i.type, i.amount, i.categoryId, i.note, i.date, action.id),
      ];
    }
    case "remove":
      return [db.prepare("DELETE FROM transactions WHERE id = ?").bind(action.id)];
    case "addCategory": {
      const c = action.category;
      return [
        db
          .prepare("INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)")
          .bind(c.id, c.name.trim(), c.icon, c.color, c.type),
      ];
    }
    case "setBudget":
      return [
        db.prepare("INSERT OR IGNORE INTO budget_months (month) VALUES (?)").bind(action.month),
        db
          .prepare(
            `INSERT INTO budgets (month, category_id, amount_limit) VALUES (?, ?, ?)
             ON CONFLICT (month, category_id) DO UPDATE SET amount_limit = excluded.amount_limit`,
          )
          .bind(action.month, action.categoryId, action.limit),
      ];
    case "removeBudget":
      return [
        db
          .prepare("DELETE FROM budgets WHERE month = ? AND category_id = ?")
          .bind(action.month, action.categoryId),
      ];
    case "createBudgetMonth": {
      const statements = [
        db.prepare("INSERT OR IGNORE INTO budget_months (month) VALUES (?)").bind(action.month),
      ];
      if (action.copyFrom) {
        // Copy limits only into a month that has none yet (mirrors the UI reducer).
        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO budgets (month, category_id, amount_limit)
               SELECT ?, category_id, amount_limit FROM budgets
               WHERE month = ? AND NOT EXISTS (SELECT 1 FROM budgets WHERE month = ?)`,
            )
            .bind(action.month, action.copyFrom, action.month),
        );
      }
      return statements;
    }
  }
}

/* --------------------------------- Router ----------------------------------- */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Everything that isn't the API is the static app.
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    try {
      await ensureSchema(env.DB);

      if (url.pathname === "/api/state" && request.method === "GET") {
        return json(await loadState(env.DB));
      }

      if (url.pathname === "/api/actions" && request.method === "POST") {
        // Requiring JSON forces a CORS preflight for cross-site requests (basic CSRF guard).
        if (!request.headers.get("content-type")?.includes("application/json")) {
          return json({ error: "Expected application/json" }, 415);
        }
        const action = parseAction(await request.json());
        await env.DB.batch(toStatements(env.DB, action));
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      if (err instanceof ValidationError) return json({ error: err.message }, 400);
      if (err instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
      console.error(err);
      return json({ error: "Internal error" }, 500);
    }
  },
};
