import { prisma } from "@/lib/prisma";
import { MonthlyRevenue, DashboardFilters } from "@/lib/types/dashboard.types";
import { buildTripWhere } from "./filters";

export async function getMonthlyRevenue(filters: DashboardFilters): Promise<MonthlyRevenue[]> {
  const tripWhere = buildTripWhere(filters);
  
  // Only include completed trips with revenue
  const trips = await prisma.trip.findMany({
    where: {
      ...tripWhere,
      status: "COMPLETED",
      revenue: { not: null }
    },
    select: {
      completedAt: true,
      revenue: true
    }
  });

  const monthlyMap = new Map<string, number>();

  for (const trip of trips) {
    if (!trip.completedAt || !trip.revenue) continue;
    
    // Group by Month Year, e.g., "Jan 2026"
    // Since we want chronological sorting later, it's better to group by YYYY-MM
    const date = new Date(trip.completedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + trip.revenue);
  }

  // Sort keys chronologically
  const sortedKeys = Array.from(monthlyMap.keys()).sort();

  // Convert to requested format
  return sortedKeys.map(key => {
    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    
    return {
      month: `${monthName} ${year}`,
      revenue: monthlyMap.get(key) || 0
    };
  });
}
