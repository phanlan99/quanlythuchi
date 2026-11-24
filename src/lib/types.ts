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
}

/** Input used by forms when creating / editing a transaction. */
export type TransactionInput = Omit<Transaction, "id">;

/** Monthly spending limit for one expense category. */
export interface Budget {
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
