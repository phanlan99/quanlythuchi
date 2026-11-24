"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { api } from "@/lib/api";
import type { AdminUserAction, PublicUser, ResetRequest } from "@/lib/users";
import { useOverlay } from "@/hooks/use-overlay";
import { Icons } from "@/components/sidebar/nav-config";
import { Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { errorMessage } from "@/components/auth/AuthShell";

interface AdminData {
  users: PublicUser[];
  resetRequests: ResetRequest[];
}

const formatDay = (unixSeconds: number) => new Date(unixSeconds * 1000).toLocaleDateString("vi-VN");

const iconButton =
  "rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

/** Admin page: every account, pending "forgot password" requests, and account actions. */
export function AdminUsersView() {
  const { user: me, status } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [version, setVersion] = useState(0); // bump to reload
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [issued, setIssued] = useState<{ name: string; password: string } | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    api
      .adminUsers()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoadError("");
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [status, version]);

  async function run(action: AdminUserAction, confirmText?: string, name = "") {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await api.adminAction(action);
      if (result.tempPassword) setIssued({ name, password: result.tempPassword });
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const resetPassword = (u: { userId: string; fullName: string; username: string }) =>
    run(
      { type: "resetPassword", userId: u.userId },
      `Cấp mật khẩu tạm thời cho ${u.fullName} (@${u.username})? Mật khẩu cũ sẽ không dùng được nữa.`,
      u.fullName,
    );

  if (status === "demo") {
    return (
      <>
        <PageHeader title="Người dùng" />
        <EmptyState>Cần chạy qua Cloudflare để quản lý người dùng.</EmptyState>
      </>
    );
  }

  const query = search.trim().toLowerCase();
  const users = (data?.users ?? []).filter(
    (u) =>
      !query ||
      [u.fullName, u.username, u.phone, u.address].some((v) => v.toLowerCase().includes(query)),
  );

  return (
    <>
      <PageHeader
        title={data ? `Người dùng (${data.users.length})` : "Người dùng"}
        actions={
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, SĐT…"
            aria-label="Tìm người dùng"
            className={`${inputClass} w-44 sm:w-60`}
          />
        }
      />

      {(loadError || actionError) && (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {loadError || actionError}
        </p>
      )}

      {!data && !loadError && <EmptyState>Đang tải…</EmptyState>}

      {data && data.resetRequests.length > 0 && (
        <Card title={`Yêu cầu cấp lại mật khẩu (${data.resetRequests.length})`} className="mb-4">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.resetRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.fullName} <span className="font-normal text-zinc-500">@{r.username}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {r.phone} · {formatDay(r.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => resetPassword(r)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Cấp mật khẩu tạm
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run({ type: "dismissReset", requestId: r.id })}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Bỏ qua
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data && (
        <Card>
          {users.length === 0 ? (
            <EmptyState>Không có người dùng phù hợp</EmptyState>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{u.fullName}</span>
                        {isMe && <Badge tone="zinc">Bạn</Badge>}
                        {u.role === "admin" && <Badge tone="emerald">Quản trị</Badge>}
                        {u.locked && <Badge tone="rose">Đã khoá</Badge>}
                        {u.mustChangePassword && <Badge tone="amber">Chờ đổi mật khẩu</Badge>}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        @{u.username} · {u.phone}
                        {u.address && ` · ${u.address}`} · {formatDay(u.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <select
                        aria-label={`Vai trò của ${u.fullName}`}
                        value={u.role}
                        disabled={isMe || busy}
                        onChange={(e) =>
                          run(
                            { type: "setRole", userId: u.id, role: e.target.value === "admin" ? "admin" : "user" },
                            `Đổi vai trò của ${u.fullName} thành "${e.target.value === "admin" ? "Quản trị" : "Người dùng"}"?`,
                          )
                        }
                        className={`${inputClass} w-auto py-1.5 text-xs`}
                      >
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị</option>
                      </select>
                      <button
                        type="button"
                        disabled={isMe || busy}
                        onClick={() =>
                          run(
                            { type: "setLocked", userId: u.id, locked: !u.locked },
                            u.locked ? undefined : `Khoá tài khoản ${u.fullName}? Người này sẽ bị đăng xuất.`,
                          )
                        }
                        aria-label={u.locked ? "Mở khoá" : "Khoá tài khoản"}
                        title={u.locked ? "Mở khoá" : "Khoá tài khoản"}
                        className={iconButton}
                      >
                        {u.locked ? Icons.unlock : Icons.lock}
                      </button>
                      <button
                        type="button"
                        disabled={isMe || busy}
                        onClick={() => resetPassword({ userId: u.id, fullName: u.fullName, username: u.username })}
                        aria-label="Cấp mật khẩu tạm"
                        title="Cấp mật khẩu tạm"
                        className={iconButton}
                      >
                        {Icons.key}
                      </button>
                      <button
                        type="button"
                        disabled={isMe || busy}
                        onClick={() =>
                          run(
                            { type: "delete", userId: u.id },
                            `Xoá vĩnh viễn ${u.fullName} và toàn bộ giao dịch, ngân sách của người này?`,
                          )
                        }
                        aria-label="Xoá người dùng"
                        title="Xoá người dùng"
                        className={`${iconButton} hover:text-rose-600`}
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {issued && <TempPasswordDialog {...issued} onClose={() => setIssued(null)} />}
    </>
  );
}

const BADGE_TONES = {
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

function Badge({ tone, children }: { tone: keyof typeof BADGE_TONES; children: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_TONES[tone]}`}>{children}</span>;
}

/** Shows a freshly issued temporary password once. It is not stored anywhere readable. */
function TempPasswordDialog({ name, password, onClose }: { name: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useOverlay(true, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="temp-password-title"
        className="relative w-full space-y-4 rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-xl dark:bg-zinc-900"
      >
        <h2 id="temp-password-title" className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-emerald-600">{Icons.key}</span>
          Mật khẩu tạm cho {name}
        </h2>
        <p className="rounded-lg bg-zinc-100 px-4 py-3 text-center font-mono text-lg tracking-wider select-all dark:bg-zinc-800">
          {password}
        </p>
        <p className="text-xs text-zinc-500">
          Chỉ hiển thị một lần. Gửi cho người dùng qua kênh riêng (gọi điện, tin nhắn). Họ sẽ phải đặt mật khẩu
          mới ngay khi đăng nhập.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(password).then(() => setCopied(true))}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {copied ? "Đã sao chép" : "Sao chép"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
