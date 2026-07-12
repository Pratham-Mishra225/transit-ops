"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil, Trash2, Receipt, Loader2 } from "lucide-react";
import { ExpenseCategoryBadge } from "@/components/expenses/ExpenseCategoryBadge";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import type { VehicleOption } from "@/components/maintenance/MaintenanceForm"; // Reusing the type
import { cn } from "@/lib/utils";
import type { Expense } from "@/lib/types/expense.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExpenseWithVehicle = Expense & {
  vehicle: { fleetCode: string; model: string };
};

interface ExpenseTableProps {
  initialExpenses: ExpenseWithVehicle[];
  vehicles: VehicleOption[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date?: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Table skeleton shown during refresh
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded-md bg-muted animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Receipt className="size-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">No expenses recorded</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Track vehicle expenses to manage your fleet's finances.
        </p>
      </div>
      <button
        id="empty-state-add-expense-btn"
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        <PlusCircle className="size-4" />
        Record Expense
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation inline banner
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  amount: number;
  category: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({
  amount,
  category,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-4 rounded-2xl border border-destructive/30 bg-card px-5 py-3 shadow-2xl">
      <p className="text-sm text-foreground">
        Delete <span className="font-semibold">{formatCurrency(amount)}</span> {category.toLowerCase()} expense?
      </p>
      <div className="flex gap-2">
        <button
          id="delete-cancel-btn"
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          id="delete-confirm-btn"
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/80 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 className="size-3 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ExpenseTable component
// ---------------------------------------------------------------------------

export function ExpenseTable({ initialExpenses, vehicles }: ExpenseTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseWithVehicle | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseWithVehicle | null>(null);

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function openEdit(expense: ExpenseWithVehicle) {
    setEditTarget(expense);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(undefined);
  }

  function handleFormSuccess() {
    closeForm();
    startRefresh(() => {
      router.refresh();
    });
  }

  function requestDelete(expense: ExpenseWithVehicle) {
    setDeleteTarget(expense);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);

    startDelete(async () => {
      try {
        await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      } catch {
        // Swallow network errors
      }
      router.refresh();
    });
  }

  const pending = isRefreshing || isDeleting;

  return (
    <div className="relative">
      {/* Global loading overlay */}
      {pending && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 flex items-start justify-center pt-24 bg-background/60 rounded-2xl"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Header row */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initialExpenses.length}{" "}
            {initialExpenses.length === 1 ? "expense" : "expenses"} recorded
          </p>
        </div>
        <button
          id="add-expense-btn"
          type="button"
          onClick={openCreate}
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          <PlusCircle className="size-4" />
          Record Expense
        </button>
      </div>

      {/* Card container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {initialExpenses.length === 0 && !pending ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Category",
                    "Amount",
                    "Vehicle",
                    "Date",
                    "Description",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        col === "Actions" && "text-right",
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending && initialExpenses.length === 0 ? (
                  <TableSkeleton rows={4} />
                ) : (
                  initialExpenses.map((expense, idx) => (
                    <tr
                      key={expense.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-muted/30",
                        idx === initialExpenses.length - 1 && "border-b-0",
                      )}
                    >
                      <td className="px-4 py-3">
                        <ExpenseCategoryBadge category={expense.category} />
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium tabular-nums">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {expense.vehicle.fleetCode}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {formatDate(expense.recordedAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">
                        {expense.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-expense-${expense.id}`}
                            type="button"
                            onClick={() => openEdit(expense)}
                            disabled={pending}
                            aria-label="Edit expense"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            id={`delete-expense-${expense.id}`}
                            type="button"
                            onClick={() => requestDelete(expense)}
                            disabled={pending}
                            aria-label="Delete expense"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <ExpenseForm
          expense={editTarget}
          vehicles={vehicles}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          amount={deleteTarget.amount}
          category={deleteTarget.category}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
