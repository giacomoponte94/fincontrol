import { trpc } from "@/lib/trpc";
import { formatCurrency, debtTypeLabels, debtStatusLabels } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  TrendingDown, TrendingUp, Wallet, AlertCircle, CheckCircle2,
  ArrowRight, Bell, CreditCard, Receipt, ShoppingBag, Plus
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

const CHART_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#fbbf24"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = trpc.dashboard.summary.useQuery();
  const { data: alerts = [] } = trpc.alerts.list.useQuery();
  const { data: debts = [] } = trpc.debts.list.useQuery();
  const markReadMutation = trpc.alerts.markRead.useMutation({ onSuccess: () => trpc.useUtils().alerts.list.invalidate() });
  const utils = trpc.useUtils();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-card rounded-xl animate-pulse border border-border/50" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-64 bg-card rounded-xl animate-pulse border border-border/50" />)}
        </div>
      </div>
    );
  }

  const totalDebt = debts.filter(d => d.status === "active" || d.status === "negotiating")
    .reduce((s, d) => s + parseFloat(String(d.currentBalance)), 0);
  const totalFixedExpenses = summary?.totalFixedExpenses ?? 0;
  const totalVariableExpenses = summary?.totalVariableExpenses ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  const unreadAlerts = alerts.filter(a => !a.isRead);

  // Debt by type chart
  const debtByType = debts
    .filter(d => d.status === "active" || d.status === "negotiating")
    .reduce((acc, d) => {
      const type = debtTypeLabels[d.type] || d.type;
      acc[type] = (acc[type] || 0) + parseFloat(String(d.currentBalance));
      return acc;
    }, {} as Record<string, number>);
  const debtChartData = Object.entries(debtByType).map(([name, value]) => ({ name, value }));

  // Expense breakdown
  const expenseData = [
    { name: "Fixos", value: totalFixedExpenses, color: "#60a5fa" },
    { name: "Variáveis", value: totalVariableExpenses, color: "#f472b6" },
  ].filter(d => d.value > 0);

  // Monthly trend (mock with current month)
  const trendData: { month: string; income: number; expenses: number }[] = [];

  const activeDebts = debts.filter(d => d.status === "active");
  const topDebts = [...activeDebts].sort((a, b) => parseFloat(String(b.currentBalance)) - parseFloat(String(a.currentBalance))).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da sua situação financeira</p>
        </div>
        <Button onClick={() => setLocation("/variable-expenses")} className="gap-2 hidden sm:flex">
          <Plus className="w-4 h-4" /> Registrar Gasto
        </Button>
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-2">
          {unreadAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <Bell className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground shrink-0"
                onClick={() => markReadMutation.mutate({ id: alert.id })}>
                Dispensar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider leading-tight">Renda Mensal</p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-semibold text-primary font-mono truncate">{formatCurrency(totalIncome)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider leading-tight">Total Gastos</p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-semibold text-foreground font-mono truncate">{formatCurrency(totalExpenses)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Fixos + Variáveis</p>
          </CardContent>
        </Card>

        <Card className={`border-border/50 ${balance >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider leading-tight">Saldo</p>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${balance >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                <Wallet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${balance >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
            </div>
            <p className={`text-base sm:text-xl font-semibold font-mono truncate ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(balance)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {savingsRate >= 0 ? `${savingsRate.toFixed(1)}% de poupança` : "Déficit mensal"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider leading-tight">Total Dívidas</p>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
              </div>
            </div>
            <p className="text-base sm:text-xl font-semibold text-destructive font-mono truncate">{formatCurrency(totalDebt)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{activeDebts.length} dívidas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="bg-card border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tendência Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.015 240)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.58 0.015 240)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.58 0.015 240)" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.24 0.015 240)", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="income" name="Renda" stroke="#4ade80" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#f472b6" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground">Registre renda e gastos para ver a tendência</p>
                <Button variant="outline" size="sm" onClick={() => setLocation("/income")}>Registrar Renda</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Composição de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {expenseData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.24 0.015 240)", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {expenseData.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-mono text-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="font-mono font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground text-center">Nenhum gasto registrado este mês</p>
                <Button variant="outline" size="sm" onClick={() => setLocation("/variable-expenses")}>Registrar Gasto</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Debts */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Principais Dívidas</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setLocation("/debts")}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDebts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                <p className="text-sm text-muted-foreground">Nenhuma dívida ativa!</p>
                <Button variant="outline" size="sm" onClick={() => setLocation("/debts")}>Cadastrar Dívida</Button>
              </div>
            ) : (
              topDebts.map(debt => {
                const balance = parseFloat(String(debt.currentBalance));
                const pct = totalDebt > 0 ? (balance / totalDebt) * 100 : 0;
                return (
                  <div key={debt.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{debt.creditor}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground border-border/50">{debtTypeLabels[debt.type]}</Badge>
                      </div>
                      <span className="text-sm font-semibold text-destructive font-mono">{formatCurrency(balance)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-destructive/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% do total de dívidas</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Debt by Type Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dívidas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {debtChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={debtChartData} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.015 240)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.58 0.015 240)" }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.58 0.015 240)" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.24 0.015 240)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="value" name="Saldo" fill="#f87171" radius={[4, 4, 0, 0]}>
                    {debtChartData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                <p className="text-sm text-muted-foreground">Sem dívidas ativas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CreditCard, label: "Nova Dívida", path: "/debts", color: "text-destructive" },
          { icon: Receipt, label: "Gasto Fixo", path: "/fixed-expenses", color: "text-blue-400" },
          { icon: ShoppingBag, label: "Gasto Variável", path: "/variable-expenses", color: "text-pink-400" },
          { icon: TrendingUp, label: "Registrar Renda", path: "/income", color: "text-primary" },
        ].map(action => (
          <Card key={action.path} className="bg-card border-border/50 hover:border-border cursor-pointer transition-colors" onClick={() => setLocation(action.path)}>
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
