import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/lib/types/expense.types";

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; className: string }
> = {
  FUEL: {
    label: "Fuel",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  TOLL: {
    label: "Toll",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  MISC: {
    label: "Misc",
    className:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

interface ExpenseCategoryBadgeProps {
  category: ExpenseCategory;
  className?: string;
}

export function ExpenseCategoryBadge({ category, className }: ExpenseCategoryBadgeProps) {
  const { label, className: colorClass } = CATEGORY_CONFIG[category];
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
