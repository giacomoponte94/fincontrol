import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getDebtsByUserId,
  createDebt,
  updateDebt,
  deleteDebt,
  getFixedExpensesByUserId,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  getVariableExpensesByUserId,
  createVariableExpense,
  updateVariableExpense,
  deleteVariableExpense,
  getIncomeByUserId,
  createIncome,
  updateIncome,
  deleteIncome,
  getAlertsByUserId,
  createAlert,
  markAlertRead,
  dismissAlert,
  getDebtPaymentsByUserId,
  createDebtPayment,
  getDashboardSummary,
  getUserByEmail,
  createUser,
} from "./db";

const paymentMethodEnum = z.enum(["pix", "debit", "credit", "cash", "transfer", "boleto", "other"]).optional();

const bankNameEnum = z.enum([
  "bradesco", "santander", "itau", "caixa", "banco_brasil",
  "nubank", "inter", "c6", "mercado_pago", "xp", "other",
]).optional();

const debtTypeEnum = z.enum([
  "credit_card",
  "personal_loan",
  "bank_loan",
  "financing",
  "overdraft",
  "revolving",
  "friend_family",
  "other",
]);

const debtStatusEnum = z.enum(["active", "negotiating", "paused", "paid"]);

const fixedCategoryEnum = z.enum([
  "housing",
  "health",
  "insurance",
  "transport",
  "education",
  "utilities",
  "subscription",
  "tax",
  "other",
]);

const variableCategoryEnum = z.enum([
  "food",
  "transport",
  "leisure",
  "shopping",
  "health",
  "education",
  "personal",
  "other",
]);

const incomeTypeEnum = z.enum(["salary", "freelance", "business", "investment", "other"]);

// ─── DEBTS ROUTER ─────────────────────────────────────────────────────────────
const debtsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getDebtsByUserId(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        creditor: z.string().min(1),
        description: z.string().optional(),
        type: debtTypeEnum,
        originalAmount: z.string(),
        currentBalance: z.string(),
        interestRate: z.string().optional(),
        monthlyPayment: z.string().optional(),
        dueDay: z.number().min(1).max(31).optional(),
        startDate: z.string().optional(),
        expectedEndDate: z.string().optional(),
        status: debtStatusEnum.optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createDebt({
        userId: ctx.user.id,
        creditor: input.creditor,
        description: input.description,
        type: input.type,
        originalAmount: input.originalAmount,
        currentBalance: input.currentBalance,
        interestRate: input.interestRate ?? "0",
        monthlyPayment: input.monthlyPayment,
        dueDay: input.dueDay,
        startDate: input.startDate,
        expectedEndDate: input.expectedEndDate,
        status: input.status ?? "active",
        notes: input.notes,
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        creditor: z.string().min(1).optional(),
        description: z.string().optional(),
        type: debtTypeEnum.optional(),
        originalAmount: z.string().optional(),
        currentBalance: z.string().optional(),
        interestRate: z.string().optional(),
        monthlyPayment: z.string().optional(),
        dueDay: z.number().min(1).max(31).optional(),
        startDate: z.string().optional(),
        expectedEndDate: z.string().optional(),
        status: debtStatusEnum.optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateDebt(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteDebt(input.id, ctx.user.id)),

  addPayment: protectedProcedure
    .input(
      z.object({
        debtId: z.number(),
        amount: z.string(),
        date: z.string(),
        paymentMethod: paymentMethodEnum,
        bankName: bankNameEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createDebtPayment({
        userId: ctx.user.id,
        debtId: input.debtId,
        amount: input.amount,
        date: input.date,
        paymentMethod: input.paymentMethod ?? null,
        bankName: input.bankName ?? null,
        notes: input.notes,
      })
    ),

  payments: protectedProcedure
    .input(z.object({ debtId: z.number().optional() }))
    .query(({ ctx, input }) => getDebtPaymentsByUserId(ctx.user.id, input.debtId)),
});

// ─── FIXED EXPENSES ROUTER ────────────────────────────────────────────────────
const fixedExpensesRouter = router({
  list: protectedProcedure.query(({ ctx }) => getFixedExpensesByUserId(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: fixedCategoryEnum,
        amount: z.string(),
        dueDay: z.number().min(1).max(31).optional(),
        paymentMethod: paymentMethodEnum,
        bankName: bankNameEnum,
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createFixedExpense({
        userId: ctx.user.id,
        name: input.name,
        category: input.category,
        amount: input.amount,
        dueDay: input.dueDay,
        paymentMethod: input.paymentMethod ?? null,
        bankName: input.bankName ?? null,
        isActive: input.isActive ?? true,
        notes: input.notes,
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: fixedCategoryEnum.optional(),
        amount: z.string().optional(),
        dueDay: z.number().min(1).max(31).optional(),
        paymentMethod: paymentMethodEnum,
        bankName: bankNameEnum,
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateFixedExpense(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteFixedExpense(input.id, ctx.user.id)),
});

// ─── VARIABLE EXPENSES ROUTER ─────────────────────────────────────────────────
const variableExpensesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        category: z.string().optional(),
      }).optional()
    )
    .query(({ ctx, input }) =>
      getVariableExpensesByUserId(ctx.user.id, input ?? {})
    ),

  create: protectedProcedure
    .input(
      z.object({
        description: z.string().min(1),
        amount: z.string(),
        category: variableCategoryEnum,
        date: z.string(),
        paymentMethod: paymentMethodEnum,
        bankName: bankNameEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createVariableExpense({
        userId: ctx.user.id,
        description: input.description,
        amount: input.amount,
        category: input.category,
        date: input.date,
        paymentMethod: input.paymentMethod ?? null,
        bankName: input.bankName ?? null,
        notes: input.notes,
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        category: variableCategoryEnum.optional(),
        date: z.string().optional(),
        paymentMethod: paymentMethodEnum,
        bankName: bankNameEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateVariableExpense(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteVariableExpense(input.id, ctx.user.id)),
});

// ─── INCOME ROUTER ────────────────────────────────────────────────────────────
const incomeRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(({ ctx, input }) => getIncomeByUserId(ctx.user.id, input ?? {})),

  create: protectedProcedure
    .input(
      z.object({
        description: z.string().min(1),
        amount: z.string(),
        type: incomeTypeEnum,
        date: z.string(),
        isRecurring: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createIncome({
        userId: ctx.user.id,
        description: input.description,
        amount: input.amount,
        type: input.type,
        date: input.date,
        isRecurring: input.isRecurring ?? false,
        notes: input.notes,
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        type: incomeTypeEnum.optional(),
        date: z.string().optional(),
        isRecurring: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateIncome(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteIncome(input.id, ctx.user.id)),
});

// ─── ALERTS ROUTER ────────────────────────────────────────────────────────────
const alertsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getAlertsByUserId(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["debt_due", "fixed_expense_due", "budget_exceeded", "custom"]),
        title: z.string().min(1),
        message: z.string().optional(),
        relatedId: z.number().optional(),
        relatedType: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createAlert({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedId: input.relatedId,
        relatedType: input.relatedType,
        dueDate: input.dueDate,
      })
    ),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => markAlertRead(input.id, ctx.user.id)),

  dismiss: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => dismissAlert(input.id, ctx.user.id)),
});

// ─── DASHBOARD ROUTER ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id)),
});

// ─── SIMULATOR ROUTER ─────────────────────────────────────────────────────────
const simulatorRouter = router({
  projectDebtPayoff: protectedProcedure
    .input(
      z.object({
        debtId: z.number(),
        monthlyPayment: z.number(),
        interestRate: z.number(),
        currentBalance: z.number(),
      })
    )
    .query(({ input }) => {
      const { monthlyPayment, interestRate, currentBalance } = input;
      const monthlyRate = interestRate / 100;
      let balance = currentBalance;
      const months: { month: number; balance: number; payment: number; interest: number }[] = [];
      let month = 0;
      const maxMonths = 360;

      while (balance > 0 && month < maxMonths) {
        month++;
        const interest = balance * monthlyRate;
        const principal = Math.min(monthlyPayment - interest, balance);
        if (monthlyPayment <= interest) {
          // Payment doesn't cover interest
          months.push({ month, balance, payment: monthlyPayment, interest });
          balance += interest - monthlyPayment;
          if (month >= 12) break;
        } else {
          balance = Math.max(0, balance - principal);
          months.push({ month, balance, payment: monthlyPayment, interest });
        }
      }

      const totalPaid = months.reduce((sum, m) => sum + m.payment, 0);
      const totalInterest = months.reduce((sum, m) => sum + m.interest, 0);

      return {
        months,
        totalMonths: month,
        totalPaid,
        totalInterest,
        payoffDate: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + month,
          1
        ).toISOString(),
      };
    }),

  compareScenarios: protectedProcedure
    .input(
      z.object({
        currentBalance: z.number(),
        interestRate: z.number(),
        scenarios: z.array(z.object({ label: z.string(), monthlyPayment: z.number() })),
      })
    )
    .query(({ input }) => {
      const { currentBalance, interestRate, scenarios } = input;
      const monthlyRate = interestRate / 100;

      return scenarios.map((scenario) => {
        let balance = currentBalance;
        let months = 0;
        let totalPaid = 0;
        const maxMonths = 360;

        while (balance > 0 && months < maxMonths) {
          months++;
          const interest = balance * monthlyRate;
          if (scenario.monthlyPayment <= interest) {
            totalPaid += scenario.monthlyPayment;
            balance += interest - scenario.monthlyPayment;
            if (months >= 12) break;
          } else {
            const principal = Math.min(scenario.monthlyPayment - interest, balance);
            balance = Math.max(0, balance - principal);
            totalPaid += scenario.monthlyPayment;
          }
        }

        return {
          label: scenario.label,
          monthlyPayment: scenario.monthlyPayment,
          totalMonths: months,
          totalPaid,
          totalInterest: totalPaid - currentBalance,
          payoffDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + months,
            1
          ).toISOString(),
        };
      });
    }),
});

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos." });
        }
        const { verifyPassword, createSessionToken } = await import("./_core/auth");
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos." });
        }
        const token = await createSessionToken(user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user };
      }),
    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado." });
        }
        const { hashPassword, createSessionToken } = await import("./_core/auth");
        const passwordHash = await hashPassword(input.password);
        const user = await createUser({ name: input.name, email: input.email, passwordHash });
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar conta." });
        const token = await createSessionToken(user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user };
      }),
  }),
  debts: debtsRouter,
  fixedExpenses: fixedExpensesRouter,
  variableExpenses: variableExpensesRouter,
  income: incomeRouter,
  alerts: alertsRouter,
  dashboard: dashboardRouter,
  simulator: simulatorRouter,
});

export type AppRouter = typeof appRouter;
