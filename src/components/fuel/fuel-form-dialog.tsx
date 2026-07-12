"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";

function toDateInputString(date?: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

export function FuelFormDialog({ log, vehicles, trips, onSuccess, onCancel }: { log: any, vehicles: any[], trips: any[], onSuccess: () => void, onCancel: () => void }) {
  const isEdit = Boolean(log);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    vehicleId: log?.vehicleId || "",
    tripId: log?.tripId || "",
    liters: log?.liters || "",
    cost: log?.cost || "",
    loggedAt: toDateInputString(log?.loggedAt || new Date()),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/fuel/${log.id}` : "/api/fuel";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
        if (res.ok) onSuccess();
      } catch {}
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-lg rounded-2xl border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Fuel Log" : "Record Fuel"}</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Vehicle</label>
              <select required value={values.vehicleId} onChange={e => setValues({ ...values, vehicleId: e.target.value })} className="h-9 rounded-lg border bg-background px-3">
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.fleetCode} - {v.model}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Trip (Optional)</label>
              <select value={values.tripId} onChange={e => setValues({ ...values, tripId: e.target.value })} className="h-9 rounded-lg border bg-background px-3">
                <option value="">No trip associated</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.tripNumber}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Liters</label>
              <input type="number" step="0.1" required value={values.liters} onChange={e => setValues({ ...values, liters: e.target.value })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Cost ($)</label>
              <input type="number" step="0.01" required value={values.cost} onChange={e => setValues({ ...values, cost: e.target.value })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Date & Time</label>
              <input type="datetime-local" required value={values.loggedAt} onChange={e => setValues({ ...values, loggedAt: e.target.value })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/80">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
