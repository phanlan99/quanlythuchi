"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { api } from "@/lib/api";
import type { CellValue, TableInfo, TableRows } from "@/lib/admin-data";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { errorMessage } from "@/components/auth/AuthShell";

type Tab = "structure" | "rows";

const thClass =
  "sticky top-0 whitespace-nowrap border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900";
const tdClass = "border-b border-zinc-100 px-3 py-2 align-top dark:border-zinc-800";

/** Admin, read-only: every D1 table's structure and its rows. */
export function DataView() {
  const { status } = useAuth();
  const [tables, setTables] = useState<TableInfo[] | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0); // bump to reload everything
  const [picked, setPicked] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("structure");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<{ key: string; data: TableRows } | null>(null);
  const [rowsError, setRowsError] = useState("");

  const selected = tables?.find((t) => t.name === picked) ?? tables?.[0] ?? null;
  const selectedName = selected?.name;
  const rowsKey = selectedName ? `${selectedName}:${page}:${version}` : "";

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    api
      .adminTables()
      .then(({ tables }) => {
        if (cancelled) return;
        setTables(tables);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [status, version]);

  useEffect(() => {
    if (tab !== "rows" || !selectedName) return;
    let cancelled = false;
    const key = `${selectedName}:${page}:${version}`;
    api
      .adminTableRows(selectedName, page)
      .then((data) => {
        if (cancelled) return;
        setRows({ key, data });
        setRowsError("");
      })
      .catch((err) => {
        if (!cancelled) setRowsError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [tab, selectedName, page, version]);

  if (status === "demo") {
    return (
      <>
        <PageHeader title="Dữ liệu" />
        <EmptyState>Cần chạy qua Cloudflare để xem cơ sở dữ liệu.</EmptyState>
      </>
    );
  }

  function selectTable(name: string) {
    setPicked(name);
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Dữ liệu"
        actions={
          <button
            type="button"
            onClick={() => setVersion((v) => v + 1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Tải lại
          </button>
        }
      />
      <p className="mb-4 text-xs text-zinc-500">
        Chỉ xem. Mật khẩu (đã băm) và mã phiên đăng nhập luôn được ẩn.
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}
      {!tables && !error && <EmptyState>Đang tải…</EmptyState>}
      {tables && tables.length === 0 && <EmptyState>Chưa có bảng nào</EmptyState>}

      {tables && selected && (
        <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
          {/* Table list: chips on mobile, column on desktop */}
          <nav aria-label="Bảng" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
              {tables.map((t) => {
                const active = t.name === selected.name;
                return (
                  <li key={t.name} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => selectTable(t.name)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-zinc-700 hover:bg-zinc-100 lg:bg-transparent dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:dark:bg-transparent"
                      }`}
                    >
                      <span className="font-mono text-xs">{t.name}</span>
                      <span className={`text-xs tabular-nums ${active ? "text-white/80" : "text-zinc-400"}`}>
                        {t.rowCount}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Card className="min-w-0 p-0!">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="font-mono text-sm font-semibold">
                {selected.name}{" "}
                <span className="font-sans text-xs font-normal text-zinc-500">
                  · {selected.columns.length} cột · {selected.rowCount} dòng
                </span>
              </h2>
              <div role="tablist" className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                {(
                  [
                    ["structure", "Cấu trúc"],
                    ["rows", "Dữ liệu"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      tab === value
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                        : "text-zinc-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tab === "structure" ? (
              <StructurePanel table={selected} />
            ) : rowsError ? (
              <p role="alert" className="p-4 text-sm text-rose-600">
                {rowsError}
              </p>
            ) : rows?.key !== rowsKey ? (
              <EmptyState>Đang tải…</EmptyState>
            ) : (
              <RowsPanel data={rows.data} onPage={setPage} />
            )}
          </Card>
        </div>
      )}
    </>
  );
}

function StructurePanel({ table }: { table: TableInfo }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Cột", "Kiểu", "Bắt buộc", "Mặc định", "Khoá", "Tham chiếu"].map((h) => (
                <th key={h} scope="col" className={thClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.columns.map((c) => (
              <tr key={c.name}>
                <td className={`${tdClass} font-mono text-xs`}>
                  {c.name}
                  {c.masked && <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 font-sans text-[10px] text-zinc-500 dark:bg-zinc-800">ẩn</span>}
                </td>
                <td className={`${tdClass} font-mono text-xs text-zinc-500`}>{c.type}</td>
                <td className={tdClass}>{c.notNull ? "✓" : ""}</td>
                <td className={`${tdClass} font-mono text-xs text-zinc-500`}>{c.defaultValue ?? ""}</td>
                <td className={tdClass}>
                  {c.primaryKey && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      PK
                    </span>
                  )}
                </td>
                <td className={`${tdClass} font-mono text-xs text-zinc-500`}>{c.references ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.sql.length > 0 && (
        <details className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <summary className="cursor-pointer text-xs font-medium text-zinc-500">Câu lệnh SQL</summary>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-950">
            {table.sql.join(";\n\n")};
          </pre>
        </details>
      )}
    </div>
  );
}

function RowsPanel({ data, onPage }: { data: TableRows; onPage: (page: number) => void }) {
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  if (data.total === 0) return <EmptyState>Bảng trống</EmptyState>;

  return (
    <div>
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {data.columns.map((c) => (
                <th key={c} scope="col" className={`${thClass} font-mono`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, r) => (
              <tr key={r} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                {row.map((value, c) => (
                  <td key={data.columns[c]} className={tdClass}>
                    <Cell
                      value={value}
                      column={data.columns[c]}
                      masked={data.masked.includes(data.columns[c])}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800">
        <span className="tabular-nums">
          {from}–{to} / {data.total} · mới nhất trước
        </span>
        <div className="flex gap-1">
          <PageButton disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>
            ‹ Trước
          </PageButton>
          <PageButton disabled={data.page >= lastPage} onClick={() => onPage(data.page + 1)}>
            Sau ›
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function Cell({ value, column, masked }: { value: CellValue; column: string; masked: boolean }) {
  if (masked) return <span className="text-xs text-zinc-400">•••• ẩn</span>;
  if (value === null) return <span className="text-xs italic text-zinc-400">NULL</span>;
  if (typeof value === "number") {
    // Unix-second timestamps (created_at, expires_at…): show the date on hover.
    const asDate =
      column.endsWith("_at") && value > 1e9 ? new Date(value * 1000).toLocaleString("vi-VN") : undefined;
    return (
      <span title={asDate} className="whitespace-nowrap tabular-nums">
        {value}
      </span>
    );
  }
  return (
    <span title={value} className="block max-w-[16rem] truncate">
      {value}
    </span>
  );
}

function PageButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-zinc-300 px-2.5 py-1 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}
