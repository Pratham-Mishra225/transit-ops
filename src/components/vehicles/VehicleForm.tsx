"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createVehicleSchema } from "@/lib/validators/vehicle.schema";
import { VEHICLE_TYPES, VEHICLE_STATUSES } from "@/lib/validators/vehicle.schema";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/types/vehicle.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VehicleFormProps {
  /** When provided, the form operates in edit mode pre-populated with this vehicle. */
  vehicle?: Vehicle;
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

const TYPE_LABELS: Record<string, string> = {
  VAN: "Van",
  MINI_TRUCK: "Mini Truck",
  TRUCK: "Truck",
  BUS: "Bus",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

function getInitialValues(vehicle?: Vehicle) {
  return {
    fleetCode: vehicle?.fleetCode ?? "",
    registrationNo: vehicle?.registrationNo ?? "",
    manufacturer: vehicle?.manufacturer ?? "",
    model: vehicle?.model ?? "",
    type: vehicle?.type ?? "VAN",
    maxLoadKg: vehicle?.maxLoadKg?.toString() ?? "",
    odometer: vehicle?.odometer?.toString() ?? "",
    acquisitionCost: vehicle?.acquisitionCost?.toString() ?? "",
    status: vehicle?.status ?? "AVAILABLE",
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
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
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
// VehicleForm
// ---------------------------------------------------------------------------

export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const isEdit = Boolean(vehicle);
  const [values, setValues] = useState(getInitialValues(vehicle));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function set(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setServerError(null);
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);

    // Client-side validation
    const parseResult = createVehicleSchema.safeParse(values);
    if (!parseResult.success) {
      setFieldErrors(parseResult.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const url = isEdit ? `/api/vehicles/${vehicle!.id}` : "/api/vehicles";
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

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-form-title"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2
            id="vehicle-form-title"
            className="text-lg font-semibold tracking-tight"
          >
            {isEdit ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <button
            type="button"
            id="vehicle-form-close-btn"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form body */}
        <form
          id="vehicle-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto max-h-[calc(100dvh-12rem)]"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field
              id="fleetCode"
              label="Fleet Code"
              error={fieldErrors.fleetCode}
              required
            >
              <input
                id="fleetCode"
                type="text"
                className={cn(inputClass, fieldErrors.fleetCode && "border-destructive")}
                placeholder="e.g. TRK-001"
                value={values.fleetCode}
                onChange={set("fleetCode")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="registrationNo"
              label="Registration No."
              error={fieldErrors.registrationNo}
              required
            >
              <input
                id="registrationNo"
                type="text"
                className={cn(inputClass, fieldErrors.registrationNo && "border-destructive")}
                placeholder="e.g. MH12AB1234"
                value={values.registrationNo}
                onChange={set("registrationNo")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="manufacturer"
              label="Manufacturer"
              error={fieldErrors.manufacturer}
            >
              <input
                id="manufacturer"
                type="text"
                className={inputClass}
                placeholder="e.g. Tata Motors"
                value={values.manufacturer}
                onChange={set("manufacturer")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="model"
              label="Model"
              error={fieldErrors.model}
              required
            >
              <input
                id="model"
                type="text"
                className={cn(inputClass, fieldErrors.model && "border-destructive")}
                placeholder="e.g. Prima 4028.S"
                value={values.model}
                onChange={set("model")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="type"
              label="Vehicle Type"
              error={fieldErrors.type}
              required
            >
              <select
                id="type"
                className={cn(selectClass, fieldErrors.type && "border-destructive")}
                value={values.type}
                onChange={set("type")}
                disabled={isPending}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="status"
              label="Status"
              error={fieldErrors.status}
              required
            >
              <select
                id="status"
                className={selectClass}
                value={values.status}
                onChange={set("status")}
                disabled={isPending}
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="maxLoadKg"
              label="Max Load (kg)"
              error={fieldErrors.maxLoadKg}
              required
            >
              <input
                id="maxLoadKg"
                type="number"
                min={1}
                step={1}
                className={cn(inputClass, fieldErrors.maxLoadKg && "border-destructive")}
                placeholder="e.g. 5000"
                value={values.maxLoadKg}
                onChange={set("maxLoadKg")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="odometer"
              label="Odometer (km)"
              error={fieldErrors.odometer}
              required
            >
              <input
                id="odometer"
                type="number"
                min={0}
                step={1}
                className={cn(inputClass, fieldErrors.odometer && "border-destructive")}
                placeholder="e.g. 12500"
                value={values.odometer}
                onChange={set("odometer")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="acquisitionCost"
              label="Acquisition Cost"
              error={fieldErrors.acquisitionCost}
              required
              // spans both columns on desktop
            >
              <input
                id="acquisitionCost"
                type="number"
                min={0}
                step={0.01}
                className={cn(inputClass, fieldErrors.acquisitionCost && "border-destructive")}
                placeholder="e.g. 2500000"
                value={values.acquisitionCost}
                onChange={set("acquisitionCost")}
                disabled={isPending}
              />
            </Field>
          </div>

          {/* Server error banner */}
          {serverError && (
            <div className="mx-6 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              id="vehicle-form-cancel-btn"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="vehicle-form-submit-btn"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
