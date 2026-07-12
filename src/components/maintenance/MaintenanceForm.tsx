"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createMaintenanceSchema } from "@/lib/validators/maintenance.schema";
import { cn } from "@/lib/utils";
import type { MaintenanceLog, MaintenanceStatus } from "@/lib/types/maintenance.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VehicleOption = { id: string; fleetCode: string; model: string; status: string };

interface MaintenanceFormProps {
  log?: MaintenanceLog;
  vehicles: VehicleOption[];
  onSuccess: () => void;
  onCancel: () => void;
}

type FieldErrors = Partial<Record<string, string[]>>;

interface ApiErrorResponse {
  error?: string;
  errors?: FieldErrors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAINTENANCE_STATUSES: MaintenanceStatus[] = ["ACTIVE", "COMPLETED"];
const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

// Returns YYYY-MM-DDThh:mm for datetime inputs
function formatDateTimeForInput(date?: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  // Adjust for timezone offset so it looks correct in local time
  const offset = d.getTimezoneOffset() * 60000;
  const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
  return localISOTime;
}

function getInitialValues(log?: MaintenanceLog) {
  return {
    vehicleId: log?.vehicleId ?? "",
    serviceType: log?.serviceType ?? "",
    description: log?.description ?? "",
    cost: log?.cost?.toString() ?? "",
    startedAt: formatDateTimeForInput(log?.startedAt) || formatDateTimeForInput(new Date()),
    completedAt: formatDateTimeForInput(log?.completedAt),
    status: log?.status ?? "ACTIVE",
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  id: string;
  label: string;
  error?: string[];
  children: React.ReactNode;
  required?: boolean;
}

function Field({ id, label, error, children, required = false }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && error.length > 0 && (
        <p className="text-xs text-destructive">{error[0]}</p>
      )}
    </div>
  );
}

const inputClass = cn(
  "h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "transition-colors",
);

const selectClass = cn(inputClass, "cursor-pointer");

// ---------------------------------------------------------------------------
// MaintenanceForm
// ---------------------------------------------------------------------------

export function MaintenanceForm({ log, vehicles, onSuccess, onCancel }: MaintenanceFormProps) {
  const isEdit = Boolean(log);
  const [values, setValues] = useState(getInitialValues(log));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function set(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setServerError(null);
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);

    // Make sure empty string for completedAt becomes undefined
    const submitValues = { ...values, completedAt: values.completedAt || undefined };
    const parseResult = createMaintenanceSchema.safeParse(submitValues);
    
    if (!parseResult.success) {
      setFieldErrors(parseResult.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const url = isEdit ? `/api/maintenance/${log!.id}` : "/api/maintenance";
        const method = isEdit ? "PATCH" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parseResult.data),
        });

        if (response.ok) {
          onSuccess();
          return;
        }

        const data: ApiErrorResponse = await response.json().catch(() => ({}));

        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setServerError(data.error ?? "An unexpected error occurred");
        }
      } catch {
        setServerError("Network error — please try again");
      }
    });
  }

  // Filter out IN_SHOP vehicles if creating new, but keep the current vehicle if editing
  const availableVehicles = vehicles.filter(
    (v) => v.status !== "IN_SHOP" || (isEdit && v.id === values.vehicleId)
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-form-title"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="maintenance-form-title" className="text-lg font-semibold tracking-tight">
            {isEdit ? "Edit Maintenance Record" : "Add Maintenance Record"}
          </h2>
          <button
            type="button"
            id="maintenance-form-close-btn"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          id="maintenance-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto max-h-[calc(100dvh-12rem)]"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field id="vehicleId" label="Vehicle" error={fieldErrors.vehicleId} required>
              <select
                id="vehicleId"
                className={cn(selectClass, fieldErrors.vehicleId && "border-destructive")}
                value={values.vehicleId}
                onChange={set("vehicleId")}
                disabled={isPending}
              >
                <option value="" disabled>
                  Select a vehicle
                </option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fleetCode} — {v.model}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="serviceType"
              label="Service Type"
              error={fieldErrors.serviceType}
              required
            >
              <input
                id="serviceType"
                type="text"
                className={cn(inputClass, fieldErrors.serviceType && "border-destructive")}
                placeholder="e.g. Oil Change, Tire Rotation"
                value={values.serviceType}
                onChange={set("serviceType")}
                disabled={isPending}
              />
            </Field>

            <Field id="status" label="Status" error={fieldErrors.status} required>
              <select
                id="status"
                className={selectClass}
                value={values.status}
                onChange={set("status")}
                disabled={isPending}
              >
                {MAINTENANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="cost" label="Cost" error={fieldErrors.cost} required>
              <input
                id="cost"
                type="number"
                min={0}
                step={0.01}
                className={cn(inputClass, fieldErrors.cost && "border-destructive")}
                placeholder="e.g. 150.00"
                value={values.cost}
                onChange={set("cost")}
                disabled={isPending}
              />
            </Field>

            <Field id="startedAt" label="Start Date/Time" error={fieldErrors.startedAt} required>
              <input
                id="startedAt"
                type="datetime-local"
                className={cn(inputClass, fieldErrors.startedAt && "border-destructive")}
                value={values.startedAt}
                onChange={set("startedAt")}
                disabled={isPending}
              />
            </Field>

            <Field id="completedAt" label="Completion Date/Time" error={fieldErrors.completedAt}>
              <input
                id="completedAt"
                type="datetime-local"
                className={cn(inputClass, fieldErrors.completedAt && "border-destructive")}
                value={values.completedAt}
                onChange={set("completedAt")}
                disabled={isPending}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                id="description"
                label="Description & Notes"
                error={fieldErrors.description}
              >
                <textarea
                  id="description"
                  rows={3}
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors",
                    fieldErrors.description && "border-destructive",
                  )}
                  placeholder="Additional details about the service..."
                  value={values.description}
                  onChange={set("description")}
                  disabled={isPending}
                />
              </Field>
            </div>
          </div>

          {serverError && (
            <div className="mx-6 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              id="maintenance-form-cancel-btn"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="maintenance-form-submit-btn"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
