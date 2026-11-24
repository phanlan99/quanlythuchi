import type { PersistedAction, RemoteState } from "./actions";

/**
 * Load everything from D1. Returns `null` when the API isn't available
 * (e.g. under `next dev`, where only the static app runs) — the caller then
 * falls back to demo data.
 */
export async function fetchRemoteState(): Promise<RemoteState | null> {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (!res.ok || !isJson) return null;
    return (await res.json()) as RemoteState;
  } catch {
    return null;
  }
}

// Actions are sent strictly one after another, so dependent writes
// (e.g. create a category, then budget it) reach D1 in order.
let queue: Promise<unknown> = Promise.resolve();

export function sendAction(action: PersistedAction): Promise<void> {
  const request = queue.then(async () => {
    const res = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    if (!res.ok) throw new Error(`Saving failed (${res.status})`);
  });
  queue = request.catch(() => {}); // a failure must not block later writes
  return request;
}
