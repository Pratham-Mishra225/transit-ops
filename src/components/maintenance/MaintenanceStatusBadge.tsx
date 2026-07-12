import { cn } from "@/lib/utils";
import type { MaintenanceStatus } from "@/lib/types/maintenance.types";

const STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
  className?: string;
}

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
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
