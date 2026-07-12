import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DriverTable } from "@/components/drivers/DriverTable";

// Opt out of static generation — this page fetches live data from the DB.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drivers | TransitOps",
  description: "Manage your fleet's drivers and personnel.",
};

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <DriverTable initialDrivers={drivers} />
      </div>
    </main>
  );
}
