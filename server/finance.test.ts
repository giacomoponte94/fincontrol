import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      ...createMockContext(),
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});

describe("simulator.compareScenarios", () => {
  it("returns correct scenario comparison", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.simulator.compareScenarios({
      currentBalance: 10000,
      interestRate: 2,
      scenarios: [
        { label: "Mínimo", monthlyPayment: 300 },
        { label: "Agressivo", monthlyPayment: 1000 },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Mínimo");
    expect(result[1].label).toBe("Agressivo");
    // Aggressive scenario should pay off faster
    expect(result[1].totalMonths).toBeLessThan(result[0].totalMonths);
  });

  it("handles zero interest rate", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.simulator.compareScenarios({
      currentBalance: 5000,
      interestRate: 0,
      scenarios: [{ label: "Fixo", monthlyPayment: 500 }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].totalMonths).toBe(10); // 5000 / 500 = 10 months
  });
});

describe("simulator.projectDebtPayoff", () => {
  it("calculates payoff timeline correctly", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.simulator.projectDebtPayoff({
      debtId: 1,
      monthlyPayment: 1000,
      interestRate: 2,
      currentBalance: 5000,
    });
    expect(result.totalMonths).toBeGreaterThan(0);
    expect(result.totalMonths).toBeLessThan(360);
    expect(result.totalPaid).toBeGreaterThan(5000);
    expect(result.months.length).toBeGreaterThan(0);
    // Last entry should have near-zero balance
    const lastEntry = result.months[result.months.length - 1];
    expect(lastEntry.balance).toBeLessThanOrEqual(1);
  });
});

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});
