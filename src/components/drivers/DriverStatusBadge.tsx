import { cn } from "@/lib/utils";
import type { DriverStatus } from "@/lib/types/driver.types";

const STATUS_CONFIG: Record<
  DriverStatus,
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
  OFF_DUTY: {
    label: "Off Duty",
    className:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  SUSPENDED: {
    label: "Suspended",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface DriverStatusBadgeProps {
  status: DriverStatus;
  className?: string;
}

export function DriverStatusBadge({ status, className }: DriverStatusBadgeProps) {
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
