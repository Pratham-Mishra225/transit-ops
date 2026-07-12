"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";

export function TripCompleteDialog({ trip, onSuccess, onCancel }: { trip: any, onSuccess: () => void, onCancel: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    endOdometer: trip.startOdometer || 0,
    fuelConsumedL: 0,
    revenue: 0,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED", ...values })
        });
        if (res.ok) onSuccess();
      } catch {}
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-sm rounded-2xl border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Complete Trip</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Final Odometer</label>
              <input type="number" required value={values.endOdometer} onChange={e => setValues({ ...values, endOdometer: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fuel Consumed (L)</label>
              <input type="number" step="0.1" required value={values.fuelConsumedL} onChange={e => setValues({ ...values, fuelConsumedL: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Revenue</label>
              <input type="number" required value={values.revenue} onChange={e => setValues({ ...values, revenue: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Complete Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
