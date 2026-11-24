"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** `false` on the server and during hydration, `true` afterwards. Use before touching `document`. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
