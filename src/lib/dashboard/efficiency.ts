import { prisma } from "@/lib/prisma";
import { DashboardFilters, FuelEfficiencyData } from "@/lib/types/dashboard.types";
import { buildTripWhere, buildVehicleWhere } from "./filters";

export async function getFuelEfficiency(filters: DashboardFilters): Promise<FuelEfficiencyData> {
  const tripWhere = buildTripWhere(filters);
  const vehicleWhere = buildVehicleWhere(filters);

  // Get completed trips with valid odometers to calculate distance and fuel consumed
  const trips = await prisma.trip.findMany({
    where: {
      ...tripWhere,
      status: "COMPLETED",
      endOdometer: { not: null },
      fuelConsumedL: { not: null, gt: 0 },
      vehicle: {
        ...vehicleWhere,
        status: { not: "RETIRED" }
      }
    },
    select: {
      vehicleId: true,
      startOdometer: true,
      endOdometer: true,
      fuelConsumedL: true,
      vehicle: {
        select: { fleetCode: true }
      }
    }
  });

  let totalDistance = 0;
  let totalFuel = 0;

  const vehicleStats = new Map<string, { distance: number; fuel: number; fleetCode: string }>();

  for (const trip of trips) {
    if (trip.endOdometer === null || trip.fuelConsumedL === null) continue;
    
    const distance = Math.max(0, trip.endOdometer - trip.startOdometer);
    const fuel = trip.fuelConsumedL;

    totalDistance += distance;
    totalFuel += fuel;

    const current = vehicleStats.get(trip.vehicleId) || { distance: 0, fuel: 0, fleetCode: trip.vehicle.fleetCode };
    current.distance += distance;
    current.fuel += fuel;
    vehicleStats.set(trip.vehicleId, current);
  }

  const overallFuelEfficiency = totalFuel > 0 ? Number((totalDistance / totalFuel).toFixed(2)) : 0;

  const vehicles = Array.from(vehicleStats.entries()).map(([vehicleId, stats]) => {
    return {
      vehicleId,
      fleetCode: stats.fleetCode,
      efficiency: stats.fuel > 0 ? Number((stats.distance / stats.fuel).toFixed(2)) : 0
    };
  }).sort((a, b) => b.efficiency - a.efficiency); // Sort most efficient first

  return {
    overallFuelEfficiency,
    vehicles
  };
}
