"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelFormDialog } from "./fuel-form-dialog";
import type { FuelLog, Vehicle, Trip } from "@prisma/client";

type FuelLogWithRelations = FuelLog & { vehicle: Pick<Vehicle, "fleetCode" | "model">; trip?: Pick<Trip, "tripNumber"> | null; };

export function FuelTable({ initialFuelLogs, vehicles, trips }: { initialFuelLogs: FuelLogWithRelations[], vehicles: any[], trips: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FuelLogWithRelations | undefined>();

  function openCreate() { setEditTarget(undefined); setFormOpen(true); }
  function openEdit(log: FuelLogWithRelations) { setEditTarget(log); setFormOpen(true); }
  
  function refresh() { startTransition(() => { router.refresh(); }); }

  async function handleDelete(log: FuelLogWithRelations) {
    if (!confirm("Delete fuel log?")) return;
    try {
      await fetch(`/api/fuel/${log.id}`, { method: "DELETE" });
      refresh();
    } catch {}
  }

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-20 flex items-start justify-center pt-24 bg-background/60 rounded-2xl">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Droplet className="text-blue-500" /> Fuel Logs</h1>
          <p className="text-sm text-muted-foreground">{initialFuelLogs.length} logs recorded</p>
        </div>
        <Button onClick={openCreate} disabled={isPending}>
          <Plus className="size-4 mr-2" /> Record Fuel
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3 text-right">Liters</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialFuelLogs.map(log => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">{new Date(log.loggedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{log.vehicle.fleetCode} <span className="text-muted-foreground font-normal ml-2">{log.vehicle.model}</span></td>
                <td className="px-4 py-3">{log.trip?.tripNumber || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{log.liters.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono">${log.cost.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(log)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-red-500 hover:text-red-600 hover:bg-red-100" onClick={() => handleDelete(log)}><Trash2 className="size-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {initialFuelLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No fuel logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && <FuelFormDialog log={editTarget} vehicles={vehicles} trips={trips} onSuccess={() => { setFormOpen(false); refresh(); }} onCancel={() => setFormOpen(false)} />}
    </div>
  );
}
