"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TripFormDialog({ trip, vehicles, drivers, onSuccess, onCancel }: { trip: any, vehicles: any[], drivers: any[], onSuccess: () => void, onCancel: () => void }) {
  const isEdit = Boolean(trip);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    source: trip?.source || "",
    destination: trip?.destination || "",
    vehicleId: trip?.vehicleId || "",
    driverId: trip?.driverId || "",
    cargoWeightKg: trip?.cargoWeightKg || 0,
    plannedDistanceKm: trip?.plannedDistanceKm || 0,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/trips/${trip.id}` : "/api/trips";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
        if (res.ok) onSuccess();
      } catch {}
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-xl rounded-2xl border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Trip" : "Create Trip"}</h2>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Source</label>
              <input required value={values.source} onChange={e => setValues({ ...values, source: e.target.value })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Destination</label>
              <input required value={values.destination} onChange={e => setValues({ ...values, destination: e.target.value })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Vehicle</label>
              <select required value={values.vehicleId} onChange={e => setValues({ ...values, vehicleId: e.target.value })} className="h-9 rounded-lg border bg-background px-3">
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.fleetCode} - {v.model}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Driver</label>
              <select required value={values.driverId} onChange={e => setValues({ ...values, driverId: e.target.value })} className="h-9 rounded-lg border bg-background px-3">
                <option value="">Select driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Cargo Weight (kg)</label>
              <input type="number" required value={values.cargoWeightKg} onChange={e => setValues({ ...values, cargoWeightKg: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Planned Distance (km)</label>
              <input type="number" required value={values.plannedDistanceKm} onChange={e => setValues({ ...values, plannedDistanceKm: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-3" />
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
