import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/lib/types/vehicle.types";

const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Available",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  ON_TRIP: {
    label: "On Trip",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  IN_SHOP: {
    label: "In Shop",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  RETIRED: {
    label: "Retired",
    className:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

interface StatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: colorClass } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
