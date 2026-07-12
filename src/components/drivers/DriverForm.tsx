"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createDriverSchema } from "@/lib/validators/driver.schema";
import { cn } from "@/lib/utils";
import type { Driver, DriverStatus } from "@/lib/types/driver.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverFormProps {
  driver?: Driver;
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

const DRIVER_STATUSES: DriverStatus[] = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

// Returns YYYY-MM-DD for date inputs
function formatDateForInput(date?: Date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getInitialValues(driver?: Driver) {
  return {
    name: driver?.name ?? "",
    licenseNumber: driver?.licenseNumber ?? "",
    licenseCategory: driver?.licenseCategory ?? "",
    licenseExpiry: formatDateForInput(driver?.licenseExpiry),
    contactNumber: driver?.contactNumber ?? "",
    safetyScore: driver?.safetyScore?.toString() ?? "100",
    status: driver?.status ?? "AVAILABLE",
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
// DriverForm
// ---------------------------------------------------------------------------

export function DriverForm({ driver, onSuccess, onCancel }: DriverFormProps) {
  const isEdit = Boolean(driver);
  const [values, setValues] = useState(getInitialValues(driver));
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

    const parseResult = createDriverSchema.safeParse(values);
    if (!parseResult.success) {
      setFieldErrors(parseResult.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const url = isEdit ? `/api/drivers/${driver!.id}` : "/api/drivers";
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
        aria-labelledby="driver-form-title"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="driver-form-title" className="text-lg font-semibold tracking-tight">
            {isEdit ? "Edit Driver" : "Add Driver"}
          </h2>
          <button
            type="button"
            id="driver-form-close-btn"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          id="driver-form"
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto max-h-[calc(100dvh-12rem)]"
        >
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field id="name" label="Full Name" error={fieldErrors.name} required>
              <input
                id="name"
                type="text"
                className={cn(inputClass, fieldErrors.name && "border-destructive")}
                placeholder="e.g. John Doe"
                value={values.name}
                onChange={set("name")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="licenseNumber"
              label="License Number"
              error={fieldErrors.licenseNumber}
              required
            >
              <input
                id="licenseNumber"
                type="text"
                className={cn(inputClass, fieldErrors.licenseNumber && "border-destructive")}
                placeholder="e.g. DL12345678"
                value={values.licenseNumber}
                onChange={set("licenseNumber")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="licenseCategory"
              label="License Category"
              error={fieldErrors.licenseCategory}
              required
            >
              <input
                id="licenseCategory"
                type="text"
                className={cn(inputClass, fieldErrors.licenseCategory && "border-destructive")}
                placeholder="e.g. Class A, CDL"
                value={values.licenseCategory}
                onChange={set("licenseCategory")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="licenseExpiry"
              label="License Expiry"
              error={fieldErrors.licenseExpiry}
              required
            >
              <input
                id="licenseExpiry"
                type="date"
                className={cn(inputClass, fieldErrors.licenseExpiry && "border-destructive")}
                value={values.licenseExpiry}
                onChange={set("licenseExpiry")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="contactNumber"
              label="Contact Number"
              error={fieldErrors.contactNumber}
              required
            >
              <input
                id="contactNumber"
                type="text"
                className={cn(inputClass, fieldErrors.contactNumber && "border-destructive")}
                placeholder="e.g. +1 555-1234"
                value={values.contactNumber}
                onChange={set("contactNumber")}
                disabled={isPending}
              />
            </Field>

            <Field
              id="safetyScore"
              label="Safety Score"
              error={fieldErrors.safetyScore}
              required
            >
              <input
                id="safetyScore"
                type="number"
                min={0}
                max={100}
                className={cn(inputClass, fieldErrors.safetyScore && "border-destructive")}
                placeholder="e.g. 100"
                value={values.safetyScore}
                onChange={set("safetyScore")}
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
                {DRIVER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {serverError && (
            <div className="mx-6 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              id="driver-form-cancel-btn"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="driver-form-submit-btn"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
