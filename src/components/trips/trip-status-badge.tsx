import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  DRAFT: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  DISPATCHED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20",
};

export function TripStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DRAFT
      )}
    >
      {status}
    </span>
  );
}
