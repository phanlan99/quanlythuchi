"use client";

import { useState } from "react";
import { useExpenses } from "@/context/ExpenseProvider";
import {
  filterTransactions,
  getAvailableMonths,
  sortByDateDesc,
  summarize,
} from "@/lib/expense-utils";
import { formatVND } from "@/lib/format";
import type { Transaction, TransactionFilters } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui";
import { TransactionComposer } from "./TransactionComposer";
import { TransactionFilterBar } from "./TransactionFilterBar";
import { TransactionList } from "./TransactionList";

export function TransactionsView() {
  const { transactions, categories, removeTransaction } = useExpenses();
  const months = getAvailableMonths(transactions);

  const defaults: TransactionFilters = {
    month: months[0] ?? "all",
    type: "all",
    categoryId: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  };
  const [filters, setFilters] = useState<TransactionFilters>(defaults);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const visible = sortByDateDesc(filterTransactions(transactions, filters, categories));
  const summary = summarize(visible);

  function handleDelete(t: Transaction) {
    if (!window.confirm(`Xóa giao dịch "${t.note || formatVND(t.amount)}"?`)) return;
    removeTransaction(t.id);
    if (editing?.id === t.id) setEditing(null);
  }

  return (
    <>
      <PageHeader title="Giao dịch" />

      {/* pb-20 keeps the last row clear of the mobile "+" button */}
      <div className="grid gap-6 pb-20 lg:grid-cols-[340px_1fr] lg:pb-0">
        <TransactionComposer
          editing={editing}
          onDone={() => setEditing(null)}
          open={composerOpen}
          onOpenChange={setComposerOpen}
        />

        <div className="min-w-0">
          <TransactionFilterBar
            filters={filters}
            defaults={defaults}
            months={months}
            categories={categories}
            summary={summary}
            onChange={setFilters}
            onAdd={() => setComposerOpen(true)}
          />
          <Card>
            <TransactionList
              transactions={visible}
              onEdit={setEditing}
              onDelete={handleDelete}
              emptyText="Không có kết quả"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
