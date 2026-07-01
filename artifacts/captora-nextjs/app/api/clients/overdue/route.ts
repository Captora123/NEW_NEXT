import { NextRequest } from "next/server";
import { db, clientsTable, paymentsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const clients = await db.select().from(clientsTable);
  const payments = await db.select().from(paymentsTable);

  const result = clients
    .filter((c) => {
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const totalPaid = cPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const packageAmount = c.packageAmount ? parseFloat(c.packageAmount) : 0;
      return packageAmount > 0 && totalPaid < packageAmount && c.status !== "Completed";
    })
    .map((c) => {
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const totalPaid = cPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const packageAmount = c.packageAmount ? parseFloat(c.packageAmount) : 0;
      return {
        ...c,
        functions: c.functions ?? [],
        packageAmount,
        albumCost: parseFloat(c.albumCost ?? "0"),
        miscExpenses: parseFloat(c.miscExpenses ?? "0"),
        totalPaid,
        totalPending: packageAmount - totalPaid,
        createdAt: c.createdAt.toISOString(),
      };
    });

  return Response.json(result);
}
