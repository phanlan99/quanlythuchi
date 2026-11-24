/**
 * Admin "Data" browser — READ-ONLY.
 *
 *   GET /api/admin/tables                     every table: columns, foreign keys, row count, DDL
 *   GET /api/admin/tables?table=x&page=1      rows of one table, newest first, 50 per page
 *
 * Table names are only accepted if they exist in sqlite_master (no SQL injection
 * through `table`), and secret columns are replaced by NULL before leaving D1.
 */
import type { CellValue, ColumnInfo, TableInfo, TableRows } from "../src/lib/admin-data";
import { HttpError, json, type D1Database } from "./env";

/** Never sent to the browser, even to admins. */
const MASKED_COLUMNS: Record<string, string[]> = {
  users: ["password_hash"],
  sessions: ["token_hash"],
};

const PAGE_SIZE = 50;

const quoteId = (name: string) => `"${name.replace(/"/g, '""')}"`;

// SQLite / Cloudflare internal tables can't (or shouldn't) be read.
const isInternal = (name: string) => name.startsWith("sqlite_") || name.startsWith("_cf_");

interface MasterRow {
  type: "table" | "index";
  name: string;
  tbl_name: string;
  sql: string | null;
}

async function readMaster(db: D1Database): Promise<MasterRow[]> {
  const { results } = await db
    .prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY name")
    .all<MasterRow>();
  return results.filter((r) => !isInternal(r.tbl_name));
}

interface PragmaColumn {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}
interface PragmaForeignKey {
  table: string;
  from: string;
  to: string;
}

export async function listTables(db: D1Database): Promise<Response> {
  const master = await readMaster(db);
  const tables = master.filter((r) => r.type === "table");
  if (tables.length === 0) return json({ tables: [] });

  // 3 statements per table, all in one round trip.
  const results = await db.batch(
    tables.flatMap((t) => [
      db.prepare(`PRAGMA table_info(${quoteId(t.name)})`),
      db.prepare(`PRAGMA foreign_key_list(${quoteId(t.name)})`),
      db.prepare(`SELECT COUNT(*) AS n FROM ${quoteId(t.name)}`),
    ]),
  );

  const info = tables.map((t, i): TableInfo => {
    const columns = results[i * 3].results as PragmaColumn[];
    const foreignKeys = results[i * 3 + 1].results as PragmaForeignKey[];
    const count = results[i * 3 + 2].results[0] as { n: number } | undefined;
    const masked = MASKED_COLUMNS[t.name] ?? [];

    return {
      name: t.name,
      rowCount: count?.n ?? 0,
      columns: columns.map(
        (c): ColumnInfo => {
          const fk = foreignKeys.find((f) => f.from === c.name);
          return {
            name: c.name,
            type: c.type || "ANY",
            notNull: c.notnull === 1,
            defaultValue: c.dflt_value,
            primaryKey: c.pk > 0,
            references: fk ? `${fk.table}.${fk.to ?? "rowid"}` : null,
            masked: masked.includes(c.name),
          };
        },
      ),
      sql: master
        .filter((r) => r.tbl_name === t.name && r.sql)
        .sort((a, b) => (a.type === b.type ? 0 : a.type === "table" ? -1 : 1))
        .map((r) => r.sql as string),
    };
  });

  return json({ tables: info });
}

export async function tableRows(db: D1Database, url: URL): Promise<Response> {
  const name = url.searchParams.get("table") ?? "";
  const master = await readMaster(db);
  if (!master.some((r) => r.type === "table" && r.name === name)) {
    throw new HttpError(404, "Không có bảng này");
  }

  const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
  const table = quoteId(name);
  const columns = (await db.prepare(`PRAGMA table_info(${table})`).all<PragmaColumn>()).results.map((c) => c.name);
  const masked = MASKED_COLUMNS[name] ?? [];
  const select = columns.map((c) => (masked.includes(c) ? `NULL AS ${quoteId(c)}` : quoteId(c))).join(", ");

  const [count, rows] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS n FROM ${table}`),
    db
      .prepare(`SELECT ${select} FROM ${table} ORDER BY rowid DESC LIMIT ? OFFSET ?`)
      .bind(PAGE_SIZE, (page - 1) * PAGE_SIZE),
  ]);

  const body: TableRows = {
    table: name,
    columns,
    masked,
    rows: (rows.results as Record<string, unknown>[]).map((r) => columns.map((c) => toCell(r[c]))),
    page,
    pageSize: PAGE_SIZE,
    total: (count.results[0] as { n: number } | undefined)?.n ?? 0,
  };
  return json(body);
}

function toCell(value: unknown): CellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (Array.isArray(value) || value instanceof ArrayBuffer) return "[BLOB]";
  return String(value);
}
