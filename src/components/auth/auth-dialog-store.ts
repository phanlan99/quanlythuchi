"use client";

import { useSyncExternalStore } from "react";

/**
 * Which auth form is open in the landing-page dialog (null = closed).
 *
 * A tiny module-level store so any component can open the dialog — navbar,
 * hero buttons, footer, search — and so protected pages / old /login URLs can
 * request it right before navigating to "/".
 */
export type AuthView = "login" | "register" | "forgot";

let current: AuthView | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function openAuthDialog(view: AuthView) {
  current = view;
  emit();
}

export function closeAuthDialog() {
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuthDialogView(): AuthView | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** Deep links: "/#login", "/#register", "/#forgot-password". */
export const AUTH_HASHES: Record<string, AuthView> = {
  "#login": "login",
  "#register": "register",
  "#forgot-password": "forgot",
};
