"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Pencil, Route, Trash2, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripFormDialog } from "./trip-form-dialog";
import { TripCompleteDialog } from "./trip-complete-dialog";
import { TripStatusBadge } from "./trip-status-badge";
import { cn } from "@/lib/utils";
import type { Trip, Vehicle, Driver } from "@prisma/client";

type TripWithRelations = Trip & { vehicle?: Pick<Vehicle, "fleetCode" | "model">; driver?: Pick<Driver, "name">; };

export function TripTable({ initialTrips, vehicles, drivers }: { initialTrips: TripWithRelations[], vehicles: any[], drivers: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TripWithRelations | undefined>();
  const [completeTarget, setCompleteTarget] = useState<TripWithRelations | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function openCreate() { setEditTarget(undefined); setFormOpen(true); }
  function openEdit(trip: TripWithRelations) { setEditTarget(trip); setFormOpen(true); }
  
  function refresh() { startTransition(() => { router.refresh(); }); }

  async function handleAction(trip: TripWithRelations, status: string) {
    setOpenMenuId(null);
    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      refresh();
    } catch {}
  }

  async function handleDelete(trip: TripWithRelations) {
    setOpenMenuId(null);
    if (!confirm("Delete trip?")) return;
    try {
      await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-sm text-muted-foreground">{initialTrips.length} trips recorded</p>
        </div>
        <Button onClick={openCreate} disabled={isPending}>
          <Plus className="size-4 mr-2" /> Create Trip
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3 text-right">Cargo (kg)</th>
              <th className="px-4 py-3 text-right">Distance (km)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialTrips.map(trip => (
              <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">{trip.tripNumber}</span>
                    <span className="text-muted-foreground text-xs">{trip.source} → {trip.destination}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{trip.vehicle?.fleetCode}</td>
                <td className="px-4 py-3">{trip.driver?.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{trip.cargoWeightKg}</td>
                <td className="px-4 py-3 text-right tabular-nums">{trip.plannedDistanceKm}</td>
                <td className="px-4 py-3"><TripStatusBadge status={trip.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <Button variant="ghost" size="icon-sm" onClick={() => setOpenMenuId(openMenuId === trip.id ? null : trip.id)}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                    {openMenuId === trip.id && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-md border bg-popover p-1 shadow-md">
                        {trip.status === "DRAFT" && (
                          <>
                            <button onClick={() => { openEdit(trip); setOpenMenuId(null); }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded">Edit</button>
                            <button onClick={() => handleAction(trip, "DISPATCHED")} className="w-full text-left px-2 py-1.5 text-sm text-blue-600 hover:bg-muted rounded">Dispatch</button>
                            <button onClick={() => handleDelete(trip)} className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-muted rounded">Delete</button>
                          </>
                        )}
                        {trip.status === "DISPATCHED" && (
                          <>
                            <button onClick={() => { setCompleteTarget(trip); setOpenMenuId(null); }} className="w-full text-left px-2 py-1.5 text-sm text-green-600 hover:bg-muted rounded">Complete</button>
                            <button onClick={() => handleAction(trip, "CANCELLED")} className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-muted rounded">Cancel</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && <TripFormDialog trip={editTarget} vehicles={vehicles} drivers={drivers} onSuccess={() => { setFormOpen(false); refresh(); }} onCancel={() => setFormOpen(false)} />}
      {completeTarget && <TripCompleteDialog trip={completeTarget} onSuccess={() => { setCompleteTarget(undefined); refresh(); }} onCancel={() => setCompleteTarget(undefined)} />}
    </div>
  );
}
