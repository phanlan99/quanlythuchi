"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { PublicUser, RegisterInput } from "@/lib/users";

/**
 * - "loading":       checking the session cookie
 * - "authenticated": signed in (`user` is set)
 * - "anonymous":     not signed in → protected pages redirect to /login
 * - "demo":          no API (e.g. `next dev`) → app runs on demo data, no login
 */
export type AuthStatus = "loading" | "authenticated" | "anonymous" | "demo";

interface AuthState {
  status: AuthStatus;
  user: PublicUser | null;
}

interface AuthContextValue extends AuthState {
  /** Resolves with the signed-in user (e.g. to route by `mustChangePassword`). */
  login: (username: string, password: string) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
  /** Replace the current user after a profile/password change. */
  setUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => ({ status: "authenticated" as const, user }))
      .catch((err) => ({
        // A real API answer (401 etc.) means "signed out"; no API at all means demo.
        status: err instanceof ApiError ? ("anonymous" as const) : ("demo" as const),
        user: null,
      }))
      .then((next) => {
        if (!cancelled) setState(next);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = (user: PublicUser) => {
    setState({ status: "authenticated", user });
    return user;
  };

  const value: AuthContextValue = {
    ...state,
    login: async (username, password) => signedIn((await api.login(username, password)).user),
    register: async (input) => signedIn((await api.register(input)).user),
    logout: async () => {
      await api.logout().catch(() => {});
      setState({ status: "anonymous", user: null });
    },
    setUser: signedIn,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
