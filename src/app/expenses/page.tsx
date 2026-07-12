import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";

// Opt out of static generation — this page fetches live data from the DB.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Expenses | TransitOps",
  description: "Track and manage fleet expenses.",
};

export default async function ExpensesPage() {
  const [expenses, vehicles] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { recordedAt: "desc" },
      include: {
        vehicle: {
          select: { fleetCode: true, model: true },
        },
      },
    }),
    prisma.vehicle.findMany({
      select: { id: true, fleetCode: true, model: true, status: true },
      orderBy: { fleetCode: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ExpenseTable initialExpenses={expenses} vehicles={vehicles} />
      </div>
    </main>
  );
}
