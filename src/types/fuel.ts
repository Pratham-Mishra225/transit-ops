export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  volume: number;
  cost: number;
  date: string;
  odometer: number;
  station: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
