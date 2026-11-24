"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { openAuthDialog, type AuthView } from "./auth-dialog-store";
import { FullPageSpinner } from "./AuthGate";

/** Old /login, /register, /forgot-password URLs: open the dialog on the landing page instead. */
export function AuthRedirect({ view }: { view: AuthView }) {
  const router = useRouter();
  useEffect(() => {
    openAuthDialog(view);
    router.replace("/");
  }, [view, router]);
  return <FullPageSpinner />;
}
