import type {
  Budget,
  Category,
  Transaction,
  TransactionFilters,
  TransactionInput,
} from "./types";

/* Pure functions only — easy to test and to reuse once a real backend exists. */

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Distinct months present in the data, newest first. */
export function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set(transactions.map((t) => monthKey(t.date)));
  return [...months].sort((a, b) => b.localeCompare(a));
}

/** "2026-11" -> "2026-12", "2026-12" -> "2027-01" */
export function nextMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
}

export function filterTransactions(
  transactions: Transaction[],
  filters: Partial<TransactionFilters>,
  categories: Category[] = [],
): Transaction[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const categoryName = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  // Tolerate a reversed range (from > to) by swapping.
  let from = filters.dateFrom ?? "";
  let to = filters.dateTo ?? "";
  if (from && to && from > to) [from, to] = [to, from];

  return transactions.filter((t) => {
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    if (filters.month && filters.month !== "all" && monthKey(t.date) !== filters.month) {
      return false;
    }
    if (filters.type && filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.categoryId && filters.categoryId !== "all" && t.categoryId !== filters.categoryId) {
      return false;
    }
    if (search) {
      const haystack = `${t.note.toLowerCase()} ${categoryName.get(t.categoryId) ?? ""}`;
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense, count: transactions.length };
}

export interface CategoryTotal {
  category: Category;
  total: number;
  /** Share of the grand total, 0–100. */
  percent: number;
}

/** Total per category for one transaction type, biggest first. */
export function totalsByCategory(
  transactions: Transaction[],
  categories: Category[],
  type: Transaction["type"] = "expense",
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  const grandTotal = [...totals.values()].reduce((s, v) => s + v, 0);

  return categories
    .filter((c) => totals.has(c.id))
    .map((category) => {
      const total = totals.get(category.id)!;
      return {
        category,
        total,
        percent: grandTotal === 0 ? 0 : (total / grandTotal) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export interface DailyTotal {
  /** YYYY-MM-DD */
  date: string;
  day: number;
  income: number;
  expense: number;
}

/** One entry per calendar day of `month` (YYYY-MM), including empty days. */
export function dailyTotals(transactions: Transaction[], month: string): DailyTotal[] {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const days: DailyTotal[] = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${month}-${String(i + 1).padStart(2, "0")}`,
    day: i + 1,
    income: 0,
    expense: 0,
  }));

  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue;
    const entry = days[Number(t.date.slice(8, 10)) - 1];
    if (entry) entry[t.type] += t.amount;
  }
  return days;
}

export type BudgetStatus = "ok" | "warning" | "over";

export interface BudgetUsage {
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  /** Can exceed 100 when over budget. */
  percent: number;
  status: BudgetStatus;
}

/** Warn once spending reaches this share of the limit. */
export const BUDGET_WARNING_THRESHOLD = 80;

export function getBudgetUsage(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  month: string,
): BudgetUsage[] {
  const monthTx = filterTransactions(transactions, { month, type: "expense" });
  const spentByCategory = new Map<string, number>();
  for (const t of monthTx) {
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  return budgets.flatMap((b) => {
    if (b.month !== month) return [];
    const category = categories.find((c) => c.id === b.categoryId);
    if (!category) return [];
    const spent = spentByCategory.get(b.categoryId) ?? 0;
    const percent = b.limit > 0 ? (spent / b.limit) * 100 : spent > 0 ? 100 : 0;
    const status: BudgetStatus =
      percent > 100 ? "over" : percent >= BUDGET_WARNING_THRESHOLD ? "warning" : "ok";
    return [{ category, limit: b.limit, spent, remaining: b.limit - spent, percent, status }];
  });
}

export type ValidationErrors = Partial<Record<keyof TransactionInput, string>>;

export function validateTransaction(
  input: TransactionInput,
  categories: Category[],
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = "Số tiền phải lớn hơn 0";
  } else if (!Number.isInteger(input.amount)) {
    errors.amount = "Số tiền phải là số nguyên (VND)";
  }

  const category = categories.find((c) => c.id === input.categoryId);
  if (!category) {
    errors.categoryId = "Vui lòng chọn danh mục";
  } else if (category.type !== input.type) {
    errors.categoryId = "Danh mục không khớp với loại giao dịch";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Ngày không hợp lệ";
  }

  if (input.note.length > 120) {
    errors.note = "Ghi chú tối đa 120 ký tự";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
