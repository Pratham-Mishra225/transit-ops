import { prisma } from "@/lib/prisma";
import { DashboardFilters, FleetUtilization } from "@/lib/types/dashboard.types";
import { buildVehicleWhere } from "./filters";

export async function getFleetUtilization(filters: DashboardFilters): Promise<FleetUtilization> {
  const vehicleWhere = buildVehicleWhere(filters);

  const vehicleCounts = await prisma.vehicle.groupBy({
    by: ["status"],
    where: vehicleWhere,
    _count: true,
  });

  const getCount = (status: string) => vehicleCounts.find(v => v.status === status)?._count || 0;

  const available = getCount("AVAILABLE");
  const onTrip = getCount("ON_TRIP");
  const inShop = getCount("IN_SHOP");
  
  const activeVehicles = available + onTrip + inShop; // Exclude RETIRED
  
  const utilizationPercentage = activeVehicles > 0 
    ? Math.round((onTrip / activeVehicles) * 100) 
    : 0;

  return {
    utilizationPercentage
  };
}
