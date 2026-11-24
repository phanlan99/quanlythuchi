"use client";

import { createContext, use, useReducer, type ReactNode } from "react";
import { DEMO_BUDGETS, DEMO_CATEGORIES, DEMO_TRANSACTIONS } from "@/lib/demo-data";
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
}

type Action =
  | { type: "add"; transaction: Transaction }
  | { type: "update"; id: string; input: TransactionInput }
  | { type: "remove"; id: string }
  | { type: "setBudget"; categoryId: string; limit: number }
  | { type: "reset" };

const initialState: ExpenseState = {
  transactions: DEMO_TRANSACTIONS,
  budgets: DEMO_BUDGETS,
};

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
    case "setBudget": {
      const exists = state.budgets.some((b) => b.categoryId === action.categoryId);
      return {
        ...state,
        budgets: exists
          ? state.budgets.map((b) =>
              b.categoryId === action.categoryId ? { ...b, limit: action.limit } : b,
            )
          : [...state.budgets, { categoryId: action.categoryId, limit: action.limit }],
      };
    }
    case "reset":
      return initialState;
  }
}

interface ExpenseContextValue extends ExpenseState {
  categories: Category[];
  getCategory: (id: string) => Category | undefined;
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  removeTransaction: (id: string) => void;
  setBudget: (categoryId: string, limit: number) => void;
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
    categories: DEMO_CATEGORIES,
    getCategory: (id) => DEMO_CATEGORIES.find((c) => c.id === id),
    addTransaction: (input) => dispatch({ type: "add", transaction: { ...input, id: createId() } }),
    updateTransaction: (id, input) => dispatch({ type: "update", id, input }),
    removeTransaction: (id) => dispatch({ type: "remove", id }),
    setBudget: (categoryId, limit) => dispatch({ type: "setBudget", categoryId, limit }),
    resetDemo: () => dispatch({ type: "reset" }),
  };

  return <ExpenseContext value={value}>{children}</ExpenseContext>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = use(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used inside <ExpenseProvider>");
  return ctx;
}
