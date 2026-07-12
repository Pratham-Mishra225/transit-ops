import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { VehicleTable } from "@/components/vehicles/VehicleTable";

// Opt out of static generation — this page fetches live data from the DB.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fleet Vehicles | TransitOps",
  description:
    "Manage your vehicle fleet — add, edit, and track every vehicle in your depot.",
};

/**
 * Server Component: fetches the vehicle list directly via Prisma (no HTTP
 * round-trip) and passes the result to the Client Component as a prop.
 * `router.refresh()` called from VehicleTable triggers this component to
 * re-run and supply fresh data.
 */
export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <VehicleTable initialVehicles={vehicles} />
      </div>
    </main>
  );
}
