import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  debts,
  fixedExpenses,
  variableExpenses,
  incomeEntries,
  alerts,
  debtPayments,
  InsertDebt,
  InsertFixedExpense,
  InsertVariableExpense,
  InsertIncomeEntry,
  InsertAlert,
  InsertDebtPayment,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── DEBTS ────────────────────────────────────────────────────────────────────

export async function getDebtsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(debts).where(eq(debts.userId, userId)).orderBy(desc(debts.createdAt));
}

export async function createDebt(data: InsertDebt) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(debts).values(data);
  return result;
}

export async function updateDebt(id: number, userId: number, data: Partial<InsertDebt>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(debts).set({ ...data, updatedAt: new Date() }).where(and(eq(debts.id, id), eq(debts.userId, userId)));
}

export async function deleteDebt(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(debts).where(and(eq(debts.id, id), eq(debts.userId, userId)));
}

// ─── FIXED EXPENSES ───────────────────────────────────────────────────────────

export async function getFixedExpensesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fixedExpenses).where(eq(fixedExpenses.userId, userId)).orderBy(desc(fixedExpenses.createdAt));
}

export async function createFixedExpense(data: InsertFixedExpense) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(fixedExpenses).values(data);
}

export async function updateFixedExpense(id: number, userId: number, data: Partial<InsertFixedExpense>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(fixedExpenses).set({ ...data, updatedAt: new Date() }).where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)));
}

export async function deleteFixedExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(fixedExpenses).where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)));
}

// ─── VARIABLE EXPENSES ────────────────────────────────────────────────────────

export async function getVariableExpensesByUserId(
  userId: number,
  filters?: { startDate?: string; endDate?: string; category?: string }
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(variableExpenses.userId, userId)];
  if (filters?.startDate) conditions.push(sql`${variableExpenses.date} >= ${filters.startDate}`);
  if (filters?.endDate) conditions.push(sql`${variableExpenses.date} <= ${filters.endDate}`);
  if (filters?.category) conditions.push(eq(variableExpenses.category, filters.category as any));
  return db.select().from(variableExpenses).where(and(...conditions)).orderBy(desc(variableExpenses.date));
}

export async function createVariableExpense(data: InsertVariableExpense) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(variableExpenses).values(data);
}

export async function updateVariableExpense(id: number, userId: number, data: Partial<InsertVariableExpense>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(variableExpenses).set(data).where(and(eq(variableExpenses.id, id), eq(variableExpenses.userId, userId)));
}

export async function deleteVariableExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(variableExpenses).where(and(eq(variableExpenses.id, id), eq(variableExpenses.userId, userId)));
}

// ─── INCOME ───────────────────────────────────────────────────────────────────

export async function getIncomeByUserId(userId: number, filters?: { startDate?: string; endDate?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(incomeEntries.userId, userId)];
  if (filters?.startDate) conditions.push(sql`${incomeEntries.date} >= ${filters.startDate}`);
  if (filters?.endDate) conditions.push(sql`${incomeEntries.date} <= ${filters.endDate}`);
  return db.select().from(incomeEntries).where(and(...conditions)).orderBy(desc(incomeEntries.date));
}

export async function createIncome(data: InsertIncomeEntry) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(incomeEntries).values(data);
}

export async function updateIncome(id: number, userId: number, data: Partial<InsertIncomeEntry>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(incomeEntries).set(data).where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)));
}

export async function deleteIncome(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(incomeEntries).where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)));
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

export async function getAlertsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.isDismissed, false)))
    .orderBy(desc(alerts.createdAt));
}

export async function createAlert(data: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(alerts).values(data);
}

export async function markAlertRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(alerts).set({ isRead: true }).where(and(eq(alerts.id, id), eq(alerts.userId, userId)));
}

export async function dismissAlert(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(alerts).set({ isDismissed: true }).where(and(eq(alerts.id, id), eq(alerts.userId, userId)));
}

// ─── DEBT PAYMENTS ────────────────────────────────────────────────────────────

export async function getDebtPaymentsByUserId(userId: number, debtId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(debtPayments.userId, userId)];
  if (debtId) conditions.push(eq(debtPayments.debtId, debtId));
  return db.select().from(debtPayments).where(and(...conditions)).orderBy(desc(debtPayments.date));
}

export async function createDebtPayment(data: InsertDebtPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(debtPayments).values(data);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function createUser(data: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const isFirst = Number(countResult[0]?.count ?? 0) === 0;
  const { nanoid } = await import("nanoid");
  await db.insert(users).values({
    openId: nanoid(),
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: isFirst ? "admin" : "user",
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return getUserByEmail(data.email);
}

// ─── DASHBOARD SUMMARY ────────────────────────────────────────────────────────

export async function getDashboardSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [userDebts, userFixedExpenses, userVariableExpenses, userIncome] = await Promise.all([
    getDebtsByUserId(userId),
    getFixedExpensesByUserId(userId),
    getVariableExpensesByUserId(userId, {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    }),
    getIncomeByUserId(userId, {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    }),
  ]);

  const totalDebt = userDebts
    .filter((d) => d.status === "active" || d.status === "negotiating")
    .reduce((sum, d) => sum + parseFloat(d.currentBalance as string), 0);

  const totalFixedExpenses = userFixedExpenses
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + parseFloat(e.amount as string), 0);

  const totalVariableExpenses = userVariableExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount as string),
    0
  );

  const totalIncome = userIncome.reduce((sum, i) => sum + parseFloat(i.amount as string), 0);

  const totalMonthlyDebtPayments = userDebts
    .filter((d) => d.status === "active" && d.monthlyPayment)
    .reduce((sum, d) => sum + parseFloat(d.monthlyPayment as string), 0);

  return {
    totalDebt,
    totalFixedExpenses,
    totalVariableExpenses,
    totalIncome,
    totalMonthlyDebtPayments,
    availableBalance: totalIncome - totalFixedExpenses - totalVariableExpenses - totalMonthlyDebtPayments,
    debtCount: userDebts.filter((d) => d.status === "active" || d.status === "negotiating").length,
    debts: userDebts,
    fixedExpenses: userFixedExpenses,
  };
}
