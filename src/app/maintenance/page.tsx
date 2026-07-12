import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MaintenanceTable } from "@/components/maintenance/MaintenanceTable";

// Opt out of static generation — this page fetches live data from the DB.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maintenance Logs | TransitOps",
  description: "Track and manage fleet vehicle maintenance.",
};

export default async function MaintenancePage() {
  const [logs, vehicles] = await Promise.all([
    prisma.maintenanceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: {
          select: { fleetCode: true, model: true },
        },
      },
    }),
    prisma.vehicle.findMany({
      select: { id: true, fleetCode: true, model: true, status: true },
      orderBy: { fleetCode: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <MaintenanceTable initialLogs={logs} vehicles={vehicles} />
      </div>
    </main>
  );
}
