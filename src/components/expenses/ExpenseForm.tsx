"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createExpenseSchema } from "@/lib/validators/expense.schema";
import { cn } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/types/expense.types";
import type { VehicleOption } from "@/components/maintenance/MaintenanceForm"; // Reusing the type

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExpenseFormProps {
  expense?: Expense;
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

const EXPENSE_CATEGORIES: ExpenseCategory[] = ["FUEL", "MAINTENANCE", "TOLL", "MISC"];
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: "Fuel",
  MAINTENANCE: "Maintenance",
  TOLL: "Toll",
  MISC: "Misc",
};

// Returns YYYY-MM-DD for date inputs
function formatDateForInput(date?: Date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getInitialValues(expense?: Expense) {
  return {
    vehicleId: expense?.vehicleId ?? "",
    category: expense?.category ?? "MISC",
    amount: expense?.amount?.toString() ?? "",
    description: expense?.description ?? "",
    recordedAt: formatDateForInput(expense?.recordedAt) || formatDateForInput(new Date()),
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
// ExpenseForm
// ---------------------------------------------------------------------------

export function ExpenseForm({ expense, vehicles, onSuccess, onCancel }: ExpenseFormProps) {
  const isEdit = Boolean(expense);
  const [values, setValues] = useState(getInitialValues(expense));
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

    const parseResult = createExpenseSchema.safeParse(values);
    
    if (!parseResult.success) {
      setFieldErrors(parseResult.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const url = isEdit ? `/api/expenses/${expense!.id}` : "/api/expenses";
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
        aria-labelledby="expense-form-title"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="expense-form-title" className="text-lg font-semibold tracking-tight">
            {isEdit ? "Edit Expense" : "Add Expense"}
          </h2>
          <button
            type="button"
            id="expense-form-close-btn"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          id="expense-form"
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
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fleetCode} — {v.model}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="category" label="Category" error={fieldErrors.category} required>
              <select
                id="category"
                className={selectClass}
                value={values.category}
                onChange={set("category")}
                disabled={isPending}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="amount" label="Amount" error={fieldErrors.amount} required>
              <input
                id="amount"
                type="number"
                min={0.01}
                step={0.01}
                className={cn(inputClass, fieldErrors.amount && "border-destructive")}
                placeholder="e.g. 50.00"
                value={values.amount}
                onChange={set("amount")}
                disabled={isPending}
              />
            </Field>

            <Field id="recordedAt" label="Recorded Date" error={fieldErrors.recordedAt} required>
              <input
                id="recordedAt"
                type="date"
                className={cn(inputClass, fieldErrors.recordedAt && "border-destructive")}
                value={values.recordedAt}
                onChange={set("recordedAt")}
                disabled={isPending}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                id="description"
                label="Description"
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
                  placeholder="Optional details about the expense..."
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
              id="expense-form-cancel-btn"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="expense-form-submit-btn"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
