"use client";

import { createContext, use, useEffect, useReducer, useState, type ReactNode } from "react";
import type { PersistedAction, RemoteState } from "@/lib/actions";
import { fetchRemoteState, sendAction } from "@/lib/api";
import {
  DEMO_BUDGET_MONTHS,
  DEMO_BUDGETS,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
} from "@/lib/demo-data";
import type { Budget, Category, TransactionInput } from "@/lib/types";

/**
 * App data store.
 *
 * - On mount it loads everything from Cloudflare D1 (GET /api/state).
 * - Every change is applied locally first (instant UI), then sent to D1
 *   (POST /api/actions) — see `commit` below.
 * - If the API isn't reachable (e.g. `next dev`), it falls back to in-memory
 *   demo data and nothing is saved ("demo" status).
 */

export type SyncStatus = "loading" | "online" | "demo";

interface ExpenseState extends RemoteState {
  status: SyncStatus;
}

type Action = PersistedAction | { type: "load"; data: RemoteState; status: SyncStatus };

const DEMO_STATE: RemoteState = {
  transactions: DEMO_TRANSACTIONS,
  budgets: DEMO_BUDGETS,
  budgetMonths: DEMO_BUDGET_MONTHS,
  categories: DEMO_CATEGORIES,
};

// Prerendered HTML starts empty (no flash of demo numbers before real data arrives).
const initialState: ExpenseState = {
  transactions: [],
  budgets: [],
  budgetMonths: [],
  categories: DEMO_CATEGORIES,
  status: "loading",
};

const sameBudget = (b: Budget, month: string, categoryId: string) =>
  b.month === month && b.categoryId === categoryId;

function reducer(state: ExpenseState, action: Action): ExpenseState {
  switch (action.type) {
    case "load":
      return { ...action.data, status: action.status };
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
  }
}

interface ExpenseContextValue extends ExpenseState {
  /** True once a save to D1 has failed (UI shows a warning). */
  syncError: boolean;
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
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

let idCounter = 0;
function createId(): string {
  idCounter += 1;
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${idCounter}`;
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchRemoteState().then((remote) => {
      if (cancelled) return;
      dispatch(
        remote
          ? { type: "load", data: remote, status: "online" }
          : { type: "load", data: DEMO_STATE, status: "demo" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Apply locally (instant), then persist to D1 when connected. */
  function commit(action: PersistedAction) {
    dispatch(action);
    if (state.status === "online") sendAction(action).catch(() => setSyncError(true));
  }

  const value: ExpenseContextValue = {
    ...state,
    syncError,
    // Newest first, for selects.
    budgetMonths: [...state.budgetMonths].sort((a, b) => b.localeCompare(a)),
    getCategory: (id) => state.categories.find((c) => c.id === id),
    addCategory: (input) => {
      const category: Category = { ...input, id: `custom-${createId()}` };
      commit({ type: "addCategory", category });
      return category;
    },
    addTransaction: (input) => commit({ type: "add", transaction: { ...input, id: createId() } }),
    updateTransaction: (id, input) => commit({ type: "update", id, input }),
    removeTransaction: (id) => commit({ type: "remove", id }),
    setBudget: (month, categoryId, limit) =>
      commit({ type: "setBudget", month, categoryId, limit }),
    removeBudget: (month, categoryId) => commit({ type: "removeBudget", month, categoryId }),
    createBudgetMonth: (month, copyFrom) => commit({ type: "createBudgetMonth", month, copyFrom }),
  };

  return <ExpenseContext value={value}>{children}</ExpenseContext>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = use(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used inside <ExpenseProvider>");
  return ctx;
}
