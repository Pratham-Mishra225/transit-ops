import { prisma } from "@/lib/prisma";
import { SearchResultItem } from "@/lib/types/dashboard.types";

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  if (!query || query.trim().length === 0) return [];

  const safeQuery = query.trim();

  // Search across Vehicles, Drivers, and Trips in parallel
  const [vehicles, drivers, trips] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        OR: [
          { fleetCode: { contains: safeQuery, mode: "insensitive" } },
          { registrationNo: { contains: safeQuery, mode: "insensitive" } },
          { model: { contains: safeQuery, mode: "insensitive" } }
        ]
      },
      take: 5
    }),
    prisma.driver.findMany({
      where: {
        OR: [
          { name: { contains: safeQuery, mode: "insensitive" } },
          { licenseNumber: { contains: safeQuery, mode: "insensitive" } }
        ]
      },
      take: 5
    }),
    prisma.trip.findMany({
      where: {
        OR: [
          { tripNumber: { contains: safeQuery, mode: "insensitive" } },
          { source: { contains: safeQuery, mode: "insensitive" } },
          { destination: { contains: safeQuery, mode: "insensitive" } }
        ]
      },
      take: 5
    })
  ]);

  const results: SearchResultItem[] = [];

  for (const v of vehicles) {
    results.push({
      id: v.id,
      title: v.fleetCode,
      subtitle: `${v.model} (${v.registrationNo})`,
      type: "VEHICLE",
      url: `/vehicles/${v.id}`
    });
  }

  for (const d of drivers) {
    results.push({
      id: d.id,
      title: d.name,
      subtitle: `License: ${d.licenseNumber}`,
      type: "DRIVER",
      url: `/drivers/${d.id}`
    });
  }

  for (const t of trips) {
    results.push({
      id: t.id,
      title: t.tripNumber,
      subtitle: `${t.source} to ${t.destination}`,
      type: "TRIP",
      url: `/trips/${t.id}`
    });
  }

  return results;
}
