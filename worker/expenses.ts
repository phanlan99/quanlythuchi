/**
 * Per-user expense data: GET /api/state and POST /api/actions.
 * Every query is scoped to the signed-in user; categories are the shared
 * built-ins (user_id NULL) plus the user's own.
 */
import type { PersistedAction, RemoteState } from "../src/lib/actions";
import type {
  Budget,
  Category,
  Transaction,
  TransactionType,
  Wallet,
  WalletKind,
} from "../src/lib/types";
import { HttpError, json, readJson, type D1Database, type D1PreparedStatement } from "./env";

/* ---------------------------------- Reads ----------------------------------- */

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  note: string;
  date: string;
  wallet_id: string | null;
}
interface BudgetRow {
  month: string;
  category_id: string;
  amount_limit: number;
}
interface WalletRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: WalletKind;
  opening_balance: number;
}

export async function getState(db: D1Database, userId: string): Promise<Response> {
  const [cats, txs, months, budgets, wallets] = await db.batch([
    db
      .prepare(
        `SELECT id, name, icon, color, type FROM categories
         WHERE user_id IS NULL OR user_id = ? ORDER BY created_at, rowid`,
      )
      .bind(userId),
    db
      .prepare(
        `SELECT id, type, amount, category_id, note, date, wallet_id FROM transactions
         WHERE user_id = ? ORDER BY date DESC, created_at DESC`,
      )
      .bind(userId),
    db.prepare("SELECT month FROM user_budget_months WHERE user_id = ? ORDER BY month DESC").bind(userId),
    db.prepare("SELECT month, category_id, amount_limit FROM user_budgets WHERE user_id = ?").bind(userId),
    db
      .prepare(
        `SELECT id, name, icon, color, kind, opening_balance FROM wallets
         WHERE user_id = ? ORDER BY created_at, rowid`,
      )
      .bind(userId),
  ]);

  const state: RemoteState = {
    categories: cats.results as Category[],
    transactions: (txs.results as TransactionRow[]).map(
      (r): Transaction => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        categoryId: r.category_id,
        note: r.note,
        date: r.date,
        walletId: r.wallet_id,
      }),
    ),
    budgetMonths: (months.results as { month: string }[]).map((r) => r.month),
    budgets: (budgets.results as BudgetRow[]).map(
      (r): Budget => ({ month: r.month, categoryId: r.category_id, limit: r.amount_limit }),
    ),
    wallets: (wallets.results as WalletRow[]).map(
      (r): Wallet => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        kind: r.kind,
        openingBalance: r.opening_balance,
      }),
    ),
  };
  return json(state);
}

/* ------------------------------- Validation --------------------------------- */

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new HttpError(400, message);
}

const isId = (v: unknown): v is string => typeof v === "string" && /^[\w-]{1,80}$/.test(v);
const isMonth = (v: unknown): v is string => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isType = (v: unknown): v is TransactionType => v === "expense" || v === "income";
const isAmount = (v: unknown, min: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= 1e13;
const isWalletKind = (v: unknown): v is WalletKind =>
  v === "bank" || v === "ewallet" || v === "cash" || v === "investment" || v === "other";
/** Missing (older clients) or null = not linked to a wallet. */
const isOptionalId = (v: unknown) => v === undefined || v === null || isId(v);

function checkTransactionFields(t: Record<string, unknown>) {
  check(isType(t.type), "Invalid type");
  check(isAmount(t.amount, 1), "Invalid amount");
  check(isId(t.categoryId), "Invalid category");
  check(typeof t.note === "string" && t.note.length <= 120, "Invalid note");
  check(isDate(t.date), "Invalid date");
  check(isOptionalId(t.walletId), "Invalid wallet");
}

function checkWalletFields(w: Record<string, unknown>) {
  check(typeof w.name === "string" && w.name.trim().length > 0 && w.name.length <= 40, "Invalid name");
  check(typeof w.icon === "string" && w.icon.length > 0 && w.icon.length <= 16, "Invalid icon");
  check(typeof w.color === "string" && /^#[0-9a-f]{6}$/i.test(w.color), "Invalid color");
  check(isWalletKind(w.kind), "Invalid kind");
  // Negative allowed (credit card / overdraft).
  check(
    typeof w.openingBalance === "number" &&
      Number.isInteger(w.openingBalance) &&
      Math.abs(w.openingBalance) <= 1e13,
    "Invalid balance",
  );
}

/** Validate untrusted JSON and narrow it to a PersistedAction. */
function parseAction(a: Record<string, unknown>): PersistedAction {
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
      check(c && typeof c === "object" && isId(c.id) && c.id.startsWith("custom-"), "Invalid category");
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
    case "addWallet": {
      const w = a.wallet as Record<string, unknown> | undefined;
      check(w && typeof w === "object" && isId(w.id) && w.id.startsWith("wallet-"), "Invalid wallet");
      checkWalletFields(w);
      return a as PersistedAction;
    }
    case "updateWallet": {
      const input = a.input as Record<string, unknown> | undefined;
      check(isId(a.id) && input && typeof input === "object", "Invalid wallet");
      checkWalletFields(input);
      return a as PersistedAction;
    }
    case "removeWallet":
      check(isId(a.id), "Invalid id");
      return a as PersistedAction;
    default:
      throw new HttpError(400, "Unknown action");
  }
}

/* --------------------------------- Writes ----------------------------------- */

/** SQL condition: category `?` is a built-in or belongs to user `?`. */
const CATEGORY_ALLOWED =
  "EXISTS (SELECT 1 FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?))";

/** SQL condition: wallet `?` is NULL, or wallet `?` belongs to user `?` (bind walletId twice). */
const WALLET_ALLOWED =
  "(? IS NULL OR EXISTS (SELECT 1 FROM wallets WHERE id = ? AND user_id = ?))";

/** Turn an action into SQL for one user. Statements run in one D1 batch (= one transaction). */
function toStatements(db: D1Database, userId: string, action: PersistedAction): D1PreparedStatement[] {
  switch (action.type) {
    case "add": {
      const t = action.transaction;
      const wallet = t.walletId ?? null;
      return [
        db
          .prepare(
            `INSERT INTO transactions (id, user_id, type, amount, category_id, note, date, wallet_id)
             SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ${CATEGORY_ALLOWED} AND ${WALLET_ALLOWED}`,
          )
          .bind(
            t.id, userId, t.type, t.amount, t.categoryId, t.note, t.date, wallet,
            t.categoryId, userId,
            wallet, wallet, userId,
          ),
      ];
    }
    case "update": {
      const i = action.input;
      const wallet = i.walletId ?? null;
      return [
        db
          .prepare(
            `UPDATE transactions SET type = ?, amount = ?, category_id = ?, note = ?, date = ?, wallet_id = ?
             WHERE id = ? AND user_id = ? AND ${CATEGORY_ALLOWED} AND ${WALLET_ALLOWED}`,
          )
          .bind(
            i.type, i.amount, i.categoryId, i.note, i.date, wallet,
            action.id, userId,
            i.categoryId, userId,
            wallet, wallet, userId,
          ),
      ];
    }
    case "remove":
      return [db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").bind(action.id, userId)];
    case "addCategory": {
      const c = action.category;
      return [
        db
          .prepare("INSERT INTO categories (id, user_id, name, icon, color, type) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(c.id, userId, c.name.trim(), c.icon, c.color, c.type),
      ];
    }
    case "setBudget":
      return [
        db.prepare("INSERT OR IGNORE INTO user_budget_months (user_id, month) VALUES (?, ?)").bind(userId, action.month),
        db
          .prepare(
            `INSERT INTO user_budgets (user_id, month, category_id, amount_limit)
             SELECT ?, ?, ?, ? WHERE ${CATEGORY_ALLOWED}
             ON CONFLICT (user_id, month, category_id) DO UPDATE SET amount_limit = excluded.amount_limit`,
          )
          .bind(userId, action.month, action.categoryId, action.limit, action.categoryId, userId),
      ];
    case "removeBudget":
      return [
        db
          .prepare("DELETE FROM user_budgets WHERE user_id = ? AND month = ? AND category_id = ?")
          .bind(userId, action.month, action.categoryId),
      ];
    case "createBudgetMonth": {
      const statements = [
        db.prepare("INSERT OR IGNORE INTO user_budget_months (user_id, month) VALUES (?, ?)").bind(userId, action.month),
      ];
      if (action.copyFrom) {
        // Copy limits only into a month that has none yet (mirrors the UI reducer).
        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO user_budgets (user_id, month, category_id, amount_limit)
               SELECT user_id, ?, category_id, amount_limit FROM user_budgets
               WHERE user_id = ? AND month = ?
                 AND NOT EXISTS (SELECT 1 FROM user_budgets WHERE user_id = ? AND month = ?)`,
            )
            .bind(action.month, userId, action.copyFrom, userId, action.month),
        );
      }
      return statements;
    }
    case "addWallet": {
      const w = action.wallet;
      return [
        db
          .prepare(
            `INSERT INTO wallets (id, user_id, name, icon, color, kind, opening_balance)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(w.id, userId, w.name.trim(), w.icon, w.color, w.kind, w.openingBalance),
      ];
    }
    case "updateWallet": {
      const i = action.input;
      return [
        db
          .prepare(
            `UPDATE wallets SET name = ?, icon = ?, color = ?, kind = ?, opening_balance = ?
             WHERE id = ? AND user_id = ?`,
          )
          .bind(i.name.trim(), i.icon, i.color, i.kind, i.openingBalance, action.id, userId),
      ];
    }
    case "removeWallet":
      // Unlink first (foreign key), then delete — same batch, so atomic.
      return [
        db
          .prepare("UPDATE transactions SET wallet_id = NULL WHERE wallet_id = ? AND user_id = ?")
          .bind(action.id, userId),
        db.prepare("DELETE FROM wallets WHERE id = ? AND user_id = ?").bind(action.id, userId),
      ];
  }
}

export async function applyAction(db: D1Database, request: Request, userId: string): Promise<Response> {
  const action = parseAction(await readJson(request));
  await db.batch(toStatements(db, userId, action));
  return json({ ok: true });
}
