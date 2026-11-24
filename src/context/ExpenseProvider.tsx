"use client";

import { createContext, use, useReducer, type ReactNode } from "react";
import {
  DEMO_BUDGET_MONTHS,
  DEMO_BUDGETS,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
} from "@/lib/demo-data";
import type { Budget, Category, Transaction, TransactionInput } from "@/lib/types";

/**
 * In-memory store for demo data. Nothing is persisted: a full page reload
 * resets everything. Client-side navigation keeps state because this provider
 * sits in the root layout (it renders no UI, so the sidebar stays per-page).
 *
 * To plug in a real backend later, keep this context's shape and replace the
 * reducer dispatches with Server Actions / API calls.
 */

interface ExpenseState {
  transactions: Transaction[];
  budgets: Budget[];
  /** Months that have a budget plan (YYYY-MM). Kept separately so a month can exist while still empty. */
  budgetMonths: string[];
  /** Built-in demo categories + any the user created. */
  categories: Category[];
}

type Action =
  | { type: "add"; transaction: Transaction }
  | { type: "addCategory"; category: Category }
  | { type: "update"; id: string; input: TransactionInput }
  | { type: "remove"; id: string }
  | { type: "setBudget"; month: string; categoryId: string; limit: number }
  | { type: "removeBudget"; month: string; categoryId: string }
  | { type: "createBudgetMonth"; month: string; copyFrom: string | null }
  | { type: "reset" };

const initialState: ExpenseState = {
  transactions: DEMO_TRANSACTIONS,
  budgets: DEMO_BUDGETS,
  budgetMonths: DEMO_BUDGET_MONTHS,
  categories: DEMO_CATEGORIES,
};

const sameBudget = (b: Budget, month: string, categoryId: string) =>
  b.month === month && b.categoryId === categoryId;

function reducer(state: ExpenseState, action: Action): ExpenseState {
  switch (action.type) {
    case "add":
      return { ...state, transactions: [action.transaction, ...state.transactions] };
    case "update":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...action.input, id: t.id } : t,
        ),
      };
    case "remove":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "addCategory":
      return { ...state, categories: [...state.categories, action.category] };
    case "setBudget": {
      const { month, categoryId, limit } = action;
      const exists = state.budgets.some((b) => sameBudget(b, month, categoryId));
      return {
        ...state,
        budgets: exists
          ? state.budgets.map((b) => (sameBudget(b, month, categoryId) ? { ...b, limit } : b))
          : [...state.budgets, { month, categoryId, limit }],
        budgetMonths: state.budgetMonths.includes(month)
          ? state.budgetMonths
          : [...state.budgetMonths, month],
      };
    }
    case "removeBudget":
      return {
        ...state,
        budgets: state.budgets.filter((b) => !sameBudget(b, action.month, action.categoryId)),
      };
    case "createBudgetMonth": {
      const { month, copyFrom } = action;
      if (state.budgetMonths.includes(month)) return state;
      const copied = copyFrom
        ? state.budgets.filter((b) => b.month === copyFrom).map((b) => ({ ...b, month }))
        : [];
      return {
        ...state,
        budgets: [...state.budgets, ...copied],
        budgetMonths: [...state.budgetMonths, month],
      };
    }
    case "reset":
      return initialState;
  }
}

interface ExpenseContextValue extends ExpenseState {
  getCategory: (id: string) => Category | undefined;
  /** Create a custom category; returns it (with its new id) so callers can use it right away. */
  addCategory: (input: Omit<Category, "id">) => Category;
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  removeTransaction: (id: string) => void;
  setBudget: (month: string, categoryId: string, limit: number) => void;
  removeBudget: (month: string, categoryId: string) => void;
  /** Create a budget plan for `month`, optionally copying limits from another month. No-op if it exists. */
  createBudgetMonth: (month: string, copyFrom: string | null) => void;
  resetDemo: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

let idCounter = 0;
function createId(): string {
  idCounter += 1;
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tx-${Date.now()}-${idCounter}`;
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: ExpenseContextValue = {
    ...state,
    // Newest first, for selects.
    budgetMonths: [...state.budgetMonths].sort((a, b) => b.localeCompare(a)),
    getCategory: (id) => state.categories.find((c) => c.id === id),
    addCategory: (input) => {
      const category: Category = { ...input, id: `custom-${createId()}` };
      dispatch({ type: "addCategory", category });
      return category;
    },
    addTransaction: (input) => dispatch({ type: "add", transaction: { ...input, id: createId() } }),
    updateTransaction: (id, input) => dispatch({ type: "update", id, input }),
    removeTransaction: (id) => dispatch({ type: "remove", id }),
    setBudget: (month, categoryId, limit) =>
      dispatch({ type: "setBudget", month, categoryId, limit }),
    removeBudget: (month, categoryId) => dispatch({ type: "removeBudget", month, categoryId }),
    createBudgetMonth: (month, copyFrom) =>
      dispatch({ type: "createBudgetMonth", month, copyFrom }),
    resetDemo: () => dispatch({ type: "reset" }),
  };

  return <ExpenseContext value={value}>{children}</ExpenseContext>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = use(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used inside <ExpenseProvider>");
  return ctx;
}
