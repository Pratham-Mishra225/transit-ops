export interface OverviewMetrics {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  driversAvailable: number;
  driversOnTrip: number;
  driversOffDuty: number;
  fleetUtilization: number;
  totalOperationalCost: number;
}

export interface MonthlyRevenue {
  month: string; // e.g. "Jan 2026"
  revenue: number;
}

export interface CostliestVehicle {
  vehicleId: string;
  fleetCode: string;
  registrationNo: string;
  totalCost: number;
}

export interface VehicleEfficiency {
  vehicleId: string;
  fleetCode: string;
  efficiency: number;
}

export interface FuelEfficiencyData {
  overallFuelEfficiency: number;
  vehicles: VehicleEfficiency[];
}

export interface FleetUtilization {
  utilizationPercentage: number;
}

export interface VehicleROI {
  vehicleId: string;
  fleetCode: string;
  roi: number; // Percentage or ratio
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: "VEHICLE" | "DRIVER" | "TRIP";
  url: string;
}

export interface DashboardFilters {
  vehicleType?: string;
  status?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  driverId?: string;
  vehicleId?: string;
}
