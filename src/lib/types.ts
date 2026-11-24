export type TransactionType = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  icon: string;
  /** Hex color used for charts / badges (applied via inline style). */
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Amount in VND, always positive. `type` decides the sign. */
  amount: number;
  categoryId: string;
  note: string;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /**
   * Wallet / account the money left (expense) or arrived in (income).
   * null/undefined = not linked (older transactions) — not counted in any balance.
   */
  walletId?: string | null;
}

/** Input used by forms when creating / editing a transaction. */
export type TransactionInput = Omit<Transaction, "id">;

export type WalletKind = "bank" | "ewallet" | "cash" | "investment" | "other";

/**
 * A place money lives: bank account, e-wallet, cash, brokerage, crypto…
 * Current balance = openingBalance + linked income − linked expenses
 * (see getWalletBalances), so it is never stored and can't drift.
 */
export interface Wallet {
  id: string;
  name: string;
  icon: string;
  /** Hex color for the card accent. */
  color: string;
  kind: WalletKind;
  /** Balance before any linked transaction. May be negative (e.g. credit card). */
  openingBalance: number;
}

export type WalletInput = Omit<Wallet, "id">;

/** Spending limit for one expense category in one month. */
export interface Budget {
  /** YYYY-MM */
  month: string;
  categoryId: string;
  limit: number;
}

export interface TransactionFilters {
  /** YYYY-MM, or "all" */
  month: string;
  type: TransactionType | "all";
  categoryId: string | "all";
  search: string;
  /** Inclusive date range, YYYY-MM-DD or "" for open-ended. */
  dateFrom: string;
  dateTo: string;
}
