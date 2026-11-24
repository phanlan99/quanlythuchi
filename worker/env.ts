/* Minimal D1 / Worker types (avoids an extra dependency) + small HTTP helpers. */

export interface D1Result<T> {
  results: T[];
  meta: { changes: number };
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result<unknown>>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
export interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/** Error with an HTTP status; the router turns it into a JSON response. */
export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers: h });
}

/**
 * Parse a JSON object body. Requiring application/json forces a CORS preflight
 * for cross-site requests, which (with SameSite cookies) blocks CSRF.
 */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new HttpError(415, "Expected application/json");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Body must be an object");
  }
  return body as Record<string, unknown>;
}

/** Read an untrusted field as a string ("" when missing or not a string). */
export const str = (value: unknown): string => (typeof value === "string" ? value : "");

export const nowSeconds = () => Math.floor(Date.now() / 1000);
