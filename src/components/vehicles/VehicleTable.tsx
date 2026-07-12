"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil, Trash2, Truck, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/vehicles/StatusBadge";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/types/vehicle.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VehicleTableProps {
  initialVehicles: Vehicle[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  VAN: "Van",
  MINI_TRUCK: "Mini Truck",
  TRUCK: "Truck",
  BUS: "Bus",
  OTHER: "Other",
};

function formatNumber(n: number) {
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Table skeleton shown during refresh
// ---------------------------------------------------------------------------

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {Array.from({ length: 9 }).map((_, j) => (
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
        <Truck className="size-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">No vehicles yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first vehicle to get started.
        </p>
      </div>
      <button
        id="empty-state-add-vehicle-btn"
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        <PlusCircle className="size-4" />
        Add Vehicle
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation inline banner
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  vehicleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({
  vehicleName,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-4 rounded-2xl border border-destructive/30 bg-card px-5 py-3 shadow-2xl">
      <p className="text-sm text-foreground">
        Delete <span className="font-semibold">{vehicleName}</span>?
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
// Main VehicleTable component
// ---------------------------------------------------------------------------

export function VehicleTable({ initialVehicles }: VehicleTableProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function openCreate() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditTarget(vehicle);
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

  function requestDelete(vehicle: Vehicle) {
    setDeleteTarget(vehicle);
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
        await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      } catch {
        // Swallow network errors — list will reconcile on next refresh
      }
      router.refresh();
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

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
            Fleet Vehicles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initialVehicles.length}{" "}
            {initialVehicles.length === 1 ? "vehicle" : "vehicles"} registered
          </p>
        </div>
        <button
          id="add-vehicle-btn"
          type="button"
          onClick={openCreate}
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          <PlusCircle className="size-4" />
          Add Vehicle
        </button>
      </div>

      {/* Card container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {initialVehicles.length === 0 && !pending ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "Fleet Code",
                    "Reg. No.",
                    "Manufacturer",
                    "Model",
                    "Type",
                    "Load (kg)",
                    "Odometer (km)",
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
                {pending && initialVehicles.length === 0 ? (
                  <TableSkeleton rows={4} />
                ) : (
                  initialVehicles.map((v, idx) => (
                    <tr
                      key={v.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-muted/30",
                        idx === initialVehicles.length - 1 && "border-b-0",
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                        {v.fleetCode}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {v.registrationNo}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {v.manufacturer ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {v.model}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TYPE_LABELS[v.type] ?? v.type}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {formatNumber(v.maxLoadKg)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(v.odometer)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-vehicle-${v.id}`}
                            type="button"
                            onClick={() => openEdit(v)}
                            disabled={pending}
                            aria-label={`Edit ${v.fleetCode}`}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            id={`delete-vehicle-${v.id}`}
                            type="button"
                            onClick={() => requestDelete(v)}
                            disabled={pending}
                            aria-label={`Delete ${v.fleetCode}`}
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

      {/* Form modal */}
      {formOpen && (
        <VehicleForm
          vehicle={editTarget}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirm
          vehicleName={`${deleteTarget.fleetCode} — ${deleteTarget.model}`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
