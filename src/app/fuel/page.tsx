import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FuelTable } from "@/components/fuel/fuel-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fuel Logs | TransitOps",
  description: "Manage fleet fuel logs.",
};

export default async function FuelPage() {
  const [fuelLogs, vehicles, trips] = await Promise.all([
    prisma.fuelLog.findMany({
      orderBy: { loggedAt: "desc" },
      include: {
        vehicle: { select: { fleetCode: true, model: true } },
        trip: { select: { tripNumber: true } },
      },
    }),
    prisma.vehicle.findMany({
      select: { id: true, fleetCode: true, model: true },
      orderBy: { fleetCode: "asc" },
    }),
    prisma.trip.findMany({
      select: { id: true, tripNumber: true },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent trips
    }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <FuelTable initialFuelLogs={fuelLogs} vehicles={vehicles} trips={trips} />
      </div>
    </main>
  );
}
