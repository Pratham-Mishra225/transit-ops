import { Prisma } from "@prisma/client";
import { DashboardFilters } from "@/lib/types/dashboard.types";
import { VehicleType } from "@prisma/client";

/**
 * Builds a Prisma `where` clause for common date filtering.
 * Uses `createdAt` for most models, but can be customized.
 */
export function buildDateFilter(filters: DashboardFilters, dateField: string = "createdAt") {
  const dateWhere: any = {};
  if (filters.dateFrom) {
    dateWhere.gte = new Date(filters.dateFrom);
  }
  if (filters.dateTo) {
    dateWhere.lte = new Date(filters.dateTo);
  }

  return Object.keys(dateWhere).length > 0 ? { [dateField]: dateWhere } : {};
}

/**
 * Parses query params from the request URL into a DashboardFilters object.
 */
export function parseDashboardFilters(searchParams: URLSearchParams): DashboardFilters {
  return {
    vehicleType: searchParams.get("vehicleType") || undefined,
    status: searchParams.get("status") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    driverId: searchParams.get("driverId") || undefined,
    vehicleId: searchParams.get("vehicleId") || undefined,
  };
}

/**
 * Builds a common where clause for Vehicles.
 */
export function buildVehicleWhere(filters: DashboardFilters): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {};

  if (filters.vehicleType) {
    where.type = filters.vehicleType as VehicleType;
  }
  if (filters.vehicleId) {
    where.id = filters.vehicleId;
  }
  // For vehicles, date filters usually apply to creation date, or we ignore them for global stats.
  // The prompt implies filtering dashboards by date generally applies to operational records,
  // but if needed, we apply it.
  
  return where;
}

/**
 * Builds a common where clause for Trips.
 */
export function buildTripWhere(filters: DashboardFilters): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = {};

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }
  if (filters.driverId) {
    where.driverId = filters.driverId;
  }
  
  const dateFilter = buildDateFilter(filters, "createdAt");
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter.createdAt;
  }
  
  return where;
}
