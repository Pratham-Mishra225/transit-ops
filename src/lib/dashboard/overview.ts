import { prisma } from "@/lib/prisma";
import { OverviewMetrics, DashboardFilters } from "@/lib/types/dashboard.types";
import { buildDateFilter, buildVehicleWhere, buildTripWhere } from "./filters";

export async function getOverviewMetrics(filters: DashboardFilters): Promise<OverviewMetrics> {
  const vehicleWhere = buildVehicleWhere(filters);
  const tripWhere = buildTripWhere(filters);
  const dateFilter = buildDateFilter(filters);

  // Run all independent aggregations in parallel
  const [
    vehicleCounts,
    tripCounts,
    driverCounts,
    totalFuelCost,
    totalMaintenanceCost,
    totalOtherExpenses
  ] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ["status"],
      where: vehicleWhere,
      _count: true,
    }),
    prisma.trip.groupBy({
      by: ["status"],
      where: tripWhere,
      _count: true,
    }),
    prisma.driver.groupBy({
      by: ["status"],
      _count: true, // Drivers are global, but could be filtered if needed
    }),
    // Operational Cost: Fuel
    prisma.fuelLog.aggregate({
      _sum: { cost: true },
      where: {
        ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
        ...dateFilter
      }
    }),
    // Operational Cost: Maintenance
    prisma.maintenanceLog.aggregate({
      _sum: { cost: true },
      where: {
        ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
        ...dateFilter
      }
    }),
    // Operational Cost: Other Expenses (excluding FUEL and MAINTENANCE categories to avoid double counting if users log them strictly via the main modules, but we'll include all others)
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        category: { notIn: ["FUEL", "MAINTENANCE"] },
        ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
        ...dateFilter
      }
    })
  ]);

  const getVCount = (status: string) => vehicleCounts.find(v => v.status === status)?._count || 0;
  const getTCount = (status: string) => tripCounts.find(t => t.status === status)?._count || 0;
  const getDCount = (status: string) => driverCounts.find(d => d.status === status)?._count || 0;

  const availableVehicles = getVCount("AVAILABLE");
  const vehiclesOnTrip = getVCount("ON_TRIP");
  const vehiclesInMaintenance = getVCount("IN_SHOP");
  const retiredVehicles = getVCount("RETIRED");
  
  const activeVehicles = availableVehicles + vehiclesOnTrip + vehiclesInMaintenance;
  
  const fleetUtilization = activeVehicles > 0 
    ? Math.round((vehiclesOnTrip / activeVehicles) * 100) 
    : 0;

  const totalCost = (totalFuelCost._sum.cost || 0) 
                  + (totalMaintenanceCost._sum.cost || 0) 
                  + (totalOtherExpenses._sum.amount || 0);

  return {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    retiredVehicles,
    
    activeTrips: getTCount("DISPATCHED"),
    pendingTrips: getTCount("DRAFT"),
    completedTrips: getTCount("COMPLETED"),
    
    driversAvailable: getDCount("AVAILABLE"),
    driversOnTrip: getDCount("ON_TRIP"),
    driversOffDuty: getDCount("OFF_DUTY"),
    
    fleetUtilization,
    totalOperationalCost: totalCost
  };
}
