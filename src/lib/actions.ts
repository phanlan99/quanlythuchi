import type { Budget, Category, Transaction, TransactionInput, Wallet, WalletInput } from "./types";

/**
 * Every data change in the app, as a plain serializable object.
 *
 * The SAME action is applied twice:
 *  1. in the browser by the reducer (instant, optimistic UI), and
 *  2. on the server by the Worker, which turns it into D1 SQL (worker/index.ts).
 *
 * Keep this file free of `@/` imports — the Worker bundles it directly.
 */
export type PersistedAction =
  | { type: "add"; transaction: Transaction }
  | { type: "update"; id: string; input: TransactionInput }
  | { type: "remove"; id: string }
  | { type: "addCategory"; category: Category }
  | { type: "setBudget"; month: string; categoryId: string; limit: number }
  | { type: "removeBudget"; month: string; categoryId: string }
  | { type: "createBudgetMonth"; month: string; copyFrom: string | null }
  | { type: "addWallet"; wallet: Wallet }
  | { type: "updateWallet"; id: string; input: WalletInput }
  /** Deletes the wallet; its transactions are kept but unlinked (walletId = null). */
  | { type: "removeWallet"; id: string };

/** Full data snapshot returned by GET /api/state. */
export interface RemoteState {
  transactions: Transaction[];
  budgets: Budget[];
  budgetMonths: string[];
  categories: Category[];
  wallets: Wallet[];
}
