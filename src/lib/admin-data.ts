/**
 * Shapes returned by the admin "Data" API (GET /api/admin/tables).
 * Keep this file free of `@/` imports — the Worker bundles it directly.
 */

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string | null;
  primaryKey: boolean;
  /** "table.column" this column references, if it is a foreign key. */
  references: string | null;
  /** Value is never sent to the browser (password hashes, session tokens). */
  masked: boolean;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
  /** CREATE TABLE / CREATE INDEX statements as stored by SQLite. */
  sql: string[];
}

export type CellValue = string | number | null;

export interface TableRows {
  table: string;
  columns: string[];
  masked: string[];
  rows: CellValue[][];
  page: number;
  pageSize: number;
  total: number;
}
