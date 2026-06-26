import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, staffTable, salaryRecordsTable } from "@workspace/db";
import {
  CreateStaffMemberBody,
  GetStaffMemberParams,
  UpdateStaffMemberParams,
  UpdateStaffMemberBody,
  DeleteStaffMemberParams,
  ListSalaryRecordsParams,
  AddSalaryRecordParams,
  AddSalaryRecordBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

function formatStaff(s: typeof staffTable.$inferSelect) {
  return {
    ...s,
    monthlySalary: parseFloat(s.monthlySalary),
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/staff", async (_req, res): Promise<void> => {
  const staff = await db.select().from(staffTable).orderBy(staffTable.name);
  res.json(staff.map(formatStaff));
});

router.post("/staff", async (req, res): Promise<void> => {
  const parsed = CreateStaffMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { monthlySalary, ...rest } = parsed.data;
  const [s] = await db.insert(staffTable).values({ ...rest, monthlySalary: monthlySalary.toString() }).returning();
  res.status(201).json(formatStaff(s));
});

router.get("/staff/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id));
  if (!s) { res.status(404).json({ error: "Staff member not found" }); return; }

  const salaryRecords = await db
    .select()
    .from(salaryRecordsTable)
    .where(eq(salaryRecordsTable.staffId, id))
    .orderBy(salaryRecordsTable.year, salaryRecordsTable.month);

  res.json({
    ...formatStaff(s),
    salaryRecords: salaryRecords.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.patch("/staff/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateStaffMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { monthlySalary, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (monthlySalary !== undefined) updates.monthlySalary = monthlySalary.toString();

  const [s] = await db.update(staffTable).set(updates).where(eq(staffTable.id, id)).returning();
  if (!s) { res.status(404).json({ error: "Staff member not found" }); return; }
  res.json(formatStaff(s));
});

router.delete("/staff/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(staffTable).where(eq(staffTable.id, id));
  res.sendStatus(204);
});

router.get("/staff/:id/salary", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const records = await db
    .select()
    .from(salaryRecordsTable)
    .where(eq(salaryRecordsTable.staffId, id))
    .orderBy(salaryRecordsTable.year, salaryRecordsTable.month);

  res.json(records.map((r) => ({ ...r, amount: parseFloat(r.amount), createdAt: r.createdAt.toISOString() })));
});

router.post("/staff/:id/salary", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AddSalaryRecordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, ...rest } = parsed.data;
  const [record] = await db
    .insert(salaryRecordsTable)
    .values({ ...rest, staffId: id, amount: amount.toString() })
    .returning();

  res.status(201).json({ ...record, amount: parseFloat(record.amount), createdAt: record.createdAt.toISOString() });
});

export default router;
