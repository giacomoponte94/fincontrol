import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Dívidas
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creditor: varchar("creditor", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "credit_card",
    "personal_loan",
    "bank_loan",
    "financing",
    "overdraft",
    "revolving",
    "friend_family",
    "other",
  ]).notNull(),
  originalAmount: decimal("originalAmount", { precision: 12, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 8, scale: 4 }).default("0").notNull(),
  monthlyPayment: decimal("monthlyPayment", { precision: 12, scale: 2 }).default("0"),
  dueDay: int("dueDay"),
  startDate: varchar("startDate", { length: 10 }),
  expectedEndDate: varchar("expectedEndDate", { length: 10 }),
  status: mysqlEnum("status", ["active", "negotiating", "paused", "paid"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

// Gastos Fixos
export const fixedExpenses = mysqlTable("fixed_expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "housing",
    "health",
    "insurance",
    "transport",
    "education",
    "utilities",
    "subscription",
    "tax",
    "other",
  ]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDay: int("dueDay"),
  paymentMethod: mysqlEnum("paymentMethod", [
    "pix",
    "debit",
    "credit",
    "cash",
    "transfer",
    "boleto",
    "other",
  ]),
  bankName: mysqlEnum("bankName", [
    "bradesco",
    "santander",
    "itau",
    "caixa",
    "banco_brasil",
    "nubank",
    "inter",
    "c6",
    "mercado_pago",
    "xp",
    "other",
  ]),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FixedExpense = typeof fixedExpenses.$inferSelect;
export type InsertFixedExpense = typeof fixedExpenses.$inferInsert;

// Gastos Variáveis
export const variableExpenses = mysqlTable("variable_expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: mysqlEnum("category", [
    "food",
    "transport",
    "leisure",
    "shopping",
    "health",
    "education",
    "personal",
    "other",
  ]).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", [
    "pix",
    "debit",
    "credit",
    "cash",
    "transfer",
    "boleto",
    "other",
  ]),
  bankName: mysqlEnum("bankName", [
    "bradesco",
    "santander",
    "itau",
    "caixa",
    "banco_brasil",
    "nubank",
    "inter",
    "c6",
    "mercado_pago",
    "xp",
    "other",
  ]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VariableExpense = typeof variableExpenses.$inferSelect;
export type InsertVariableExpense = typeof variableExpenses.$inferInsert;

// Entradas de Renda
export const incomeEntries = mysqlTable("income_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["salary", "freelance", "business", "investment", "other"]).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type InsertIncomeEntry = typeof incomeEntries.$inferInsert;

// Alertas
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["debt_due", "fixed_expense_due", "budget_exceeded", "custom"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedId: int("relatedId"),
  relatedType: varchar("relatedType", { length: 64 }),
  dueDate: varchar("dueDate", { length: 10 }),
  isRead: boolean("isRead").default(false).notNull(),
  isDismissed: boolean("isDismissed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Pagamentos de Dívidas (histórico)
export const debtPayments = mysqlTable("debt_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  debtId: int("debtId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", [
    "pix",
    "debit",
    "credit",
    "cash",
    "transfer",
    "boleto",
    "other",
  ]),
  bankName: mysqlEnum("bankName", [
    "bradesco",
    "santander",
    "itau",
    "caixa",
    "banco_brasil",
    "nubank",
    "inter",
    "c6",
    "mercado_pago",
    "xp",
    "other",
  ]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = typeof debtPayments.$inferInsert;
