import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TripTable } from "@/components/trips/trip-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trips | TransitOps",
  description: "Manage fleet trips.",
};

export default async function TripsPage() {
  const [trips, vehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { fleetCode: true, model: true } },
        driver: { select: { name: true } },
      },
    }),
    prisma.vehicle.findMany({
      select: { id: true, fleetCode: true, model: true, status: true },
      orderBy: { fleetCode: "asc" },
    }),
    prisma.driver.findMany({
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <TripTable initialTrips={trips} vehicles={vehicles} drivers={drivers} />
      </div>
    </main>
  );
}
