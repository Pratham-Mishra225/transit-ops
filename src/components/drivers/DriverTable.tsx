"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { DriverStatusBadge } from "@/components/drivers/DriverStatusBadge";
import { DriverForm } from "@/components/drivers/DriverForm";
import { cn } from "@/lib/utils";
import type { Driver } from "@/lib/types/driver.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverTableProps {
  initialDrivers: Driver[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// ---------------------------------------------------------------------------
// Table skeleton shown during refresh
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 7 }).map((_, j) => (
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
        <Users className="size-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">No drivers yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first driver to get started.
        </p>
      </div>
      <button
        id="empty-state-add-driver-btn"
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        <PlusCircle className="size-4" />
        Add Driver
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation inline banner
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  driverName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({
  driverName,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-4 rounded-2xl border border-destructive/30 bg-card px-5 py-3 shadow-2xl">
      <p className="text-sm text-foreground">
        Delete <span className="font-semibold">{driverName}</span>?
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
// Main DriverTable component
// ---------------------------------------------------------------------------

export function DriverTable({ initialDrivers }: DriverTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function openEdit(driver: Driver) {
    setEditTarget(driver);
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

  function requestDelete(driver: Driver) {
    setDeleteTarget(driver);
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
        await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      } catch {
        // Swallow network errors — list will reconcile on next refresh
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
            Drivers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initialDrivers.length}{" "}
            {initialDrivers.length === 1 ? "driver" : "drivers"} registered
          </p>
        </div>
        <button
          id="add-driver-btn"
          type="button"
          onClick={openCreate}
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          <PlusCircle className="size-4" />
          Add Driver
        </button>
      </div>

      {/* Card container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {initialDrivers.length === 0 && !pending ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Name",
                    "License No.",
                    "Category",
                    "Expiry",
                    "Safety Score",
                    "Status",
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
                {pending && initialDrivers.length === 0 ? (
                  <TableSkeleton rows={4} />
                ) : (
                  initialDrivers.map((d, idx) => (
                    <tr
                      key={d.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-muted/30",
                        idx === initialDrivers.length - 1 && "border-b-0",
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {d.name}
                        <div className="text-xs font-normal text-muted-foreground">
                          {d.contactNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {d.licenseNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.licenseCategory}
                      </td>
                      <td className="px-4 py-3 text-foreground tabular-nums">
                        {formatDate(d.licenseExpiry)}
                      </td>
                      <td className="px-4 py-3 text-foreground tabular-nums">
                        {d.safetyScore}/100
                      </td>
                      <td className="px-4 py-3">
                        <DriverStatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-driver-${d.id}`}
                            type="button"
                            onClick={() => openEdit(d)}
                            disabled={pending}
                            aria-label={`Edit ${d.name}`}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            id={`delete-driver-${d.id}`}
                            type="button"
                            onClick={() => requestDelete(d)}
                            disabled={pending}
                            aria-label={`Delete ${d.name}`}
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
        <DriverForm
          driver={editTarget}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          driverName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
