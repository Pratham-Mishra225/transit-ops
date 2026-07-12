import { prisma } from "@/lib/prisma";
import { DashboardFilters, CostliestVehicle, VehicleROI } from "@/lib/types/dashboard.types";
import { buildVehicleWhere, buildDateFilter } from "./filters";

export async function getVehicleCosts(filters: DashboardFilters) {
  const vehicleWhere = buildVehicleWhere(filters);
  const dateFilter = buildDateFilter(filters);

  // We want to fetch all active vehicles and their associated logs to compute costs.
  // Using Prisma aggregate group by could work, but because we need to join across 3 tables,
  // fetching the sums per vehicle via findMany with relation counts/sums is often easier in Prisma.
  // But Prisma doesn't support _sum on relations in findMany easily.
  // So we will do parallel groupBys and merge in memory.

  const [vehicles, fuelAgg, maintAgg, expenseAgg, revenueAgg] = await Promise.all([
    prisma.vehicle.findMany({
      where: { ...vehicleWhere, status: { not: "RETIRED" } },
      select: { id: true, fleetCode: true, registrationNo: true, acquisitionCost: true }
    }),
    prisma.fuelLog.groupBy({
      by: ["vehicleId"],
      _sum: { cost: true },
      where: dateFilter
    }),
    prisma.maintenanceLog.groupBy({
      by: ["vehicleId"],
      _sum: { cost: true },
      where: dateFilter
    }),
    prisma.expense.groupBy({
      by: ["vehicleId"],
      _sum: { amount: true },
      where: { ...dateFilter, category: { notIn: ["FUEL", "MAINTENANCE"] } }
    }),
    prisma.trip.groupBy({
      by: ["vehicleId"],
      _sum: { revenue: true },
      where: { ...buildDateFilter(filters, "completedAt"), status: "COMPLETED" }
    })
  ]);

  const fuelMap = new Map(fuelAgg.map(f => [f.vehicleId, f._sum.cost || 0]));
  const maintMap = new Map(maintAgg.map(m => [m.vehicleId, m._sum.cost || 0]));
  const expenseMap = new Map(expenseAgg.map(e => [e.vehicleId, e._sum.amount || 0]));
  const revenueMap = new Map(revenueAgg.map(r => [r.vehicleId, r._sum.revenue || 0]));

  const vehicleStats = vehicles.map(v => {
    const fuel = fuelMap.get(v.id) || 0;
    const maint = maintMap.get(v.id) || 0;
    const exp = expenseMap.get(v.id) || 0;
    const revenue = revenueMap.get(v.id) || 0;
    const totalCost = fuel + maint + exp;

    // ROI = (Revenue - TotalCost) / AcquisitionCost
    let roi = 0;
    if (v.acquisitionCost && v.acquisitionCost > 0) {
      roi = ((revenue - totalCost) / v.acquisitionCost) * 100;
    }

    return {
      vehicleId: v.id,
      fleetCode: v.fleetCode,
      registrationNo: v.registrationNo,
      totalCost,
      roi: Number(roi.toFixed(2)) // Round to 2 decimal places
    };
  });

  return vehicleStats;
}

export async function getCostliestVehicles(filters: DashboardFilters): Promise<CostliestVehicle[]> {
  const stats = await getVehicleCosts(filters);
  
  // Sort descending by total cost and take top 5
  return stats
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5)
    .map(v => ({
      vehicleId: v.vehicleId,
      fleetCode: v.fleetCode,
      registrationNo: v.registrationNo,
      totalCost: v.totalCost
    }));
}

export async function getVehicleROI(filters: DashboardFilters): Promise<VehicleROI[]> {
  const stats = await getVehicleCosts(filters);

  // Sort descending by ROI
  return stats
    .sort((a, b) => b.roi - a.roi)
    .map(v => ({
      vehicleId: v.vehicleId,
      fleetCode: v.fleetCode,
      roi: v.roi
    }));
}
