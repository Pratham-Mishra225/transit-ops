export const TRIP_STATUSES = [
  "Draft",
  "Dispatched",
  "Completed",
  "Cancelled",
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  finalOdometer?: number;
  status: TripStatus;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
}
