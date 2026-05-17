import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, debtTypeLabels } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingDown, Clock, DollarSign, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Strategy = "avalanche" | "snowball" | "custom";

function simulateDebtPayoff(
  debts: { id: number; creditor: string; balance: number; rate: number; minPayment: number }[],
  extraMonthly: number,
  strategy: Strategy
): { months: number; totalInterest: number; timeline: { month: number; totalBalance: number }[]; debtOrder: string[] } {
  if (debts.length === 0 || debts.every(d => d.balance <= 0)) return { months: 0, totalInterest: 0, timeline: [], debtOrder: [] };

  let remaining = debts.map(d => ({ ...d, balance: d.balance }));
  let month = 0;
  let totalInterest = 0;
  const timeline: { month: number; totalBalance: number }[] = [];
  const debtOrder: string[] = [];

  const sortDebts = () => {
    if (strategy === "avalanche") remaining.sort((a, b) => b.rate - a.rate);
    else if (strategy === "snowball") remaining.sort((a, b) => a.balance - b.balance);
  };

  sortDebts();

  while (remaining.some(d => d.balance > 0) && month < 360) {
    month++;
    let availableExtra = extraMonthly;

    // Apply interest and minimum payments
    remaining = remaining.map(d => {
      if (d.balance <= 0) return d;
      const interest = d.balance * (d.rate / 100);
      totalInterest += interest;
      const newBalance = d.balance + interest - d.minPayment;
      return { ...d, balance: Math.max(0, newBalance) };
    });

    // Apply extra payment to priority debt
    sortDebts();
    for (const debt of remaining) {
      if (debt.balance <= 0) continue;
      const payment = Math.min(availableExtra, debt.balance);
      debt.balance -= payment;
      availableExtra -= payment;
      if (debt.balance <= 0 && !debtOrder.includes(debt.creditor)) {
        debtOrder.push(debt.creditor);
      }
      if (availableExtra <= 0) break;
    }

    const totalBalance = remaining.reduce((s, d) => s + Math.max(0, d.balance), 0);
    if (month % 3 === 0 || totalBalance < 100) {
      timeline.push({ month, totalBalance: Math.round(totalBalance) });
    }
    if (totalBalance < 1) break;
  }

  return { months: month, totalInterest: Math.round(totalInterest), timeline, debtOrder };
}

export default function Simulator() {
  const [monthlyPayment, setMonthlyPayment] = useState(2000);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [selectedDebtId, setSelectedDebtId] = useState<string>("all");

  const { data: debts = [] } = trpc.debts.list.useQuery();
  const { data: summary } = trpc.dashboard.summary.useQuery();

  const activeDebts = debts.filter(d => d.status === "active" || d.status === "negotiating");
  const totalDebt = activeDebts.reduce((s, d) => s + parseFloat(String(d.currentBalance)), 0);
  const totalMinPayments = activeDebts.reduce((s, d) => s + parseFloat(String(d.monthlyPayment ?? "0")), 0);
  const availableBalance = summary?.availableBalance ?? 0;

  const debtInputs = activeDebts.map(d => ({
    id: d.id,
    creditor: d.creditor,
    balance: parseFloat(String(d.currentBalance)),
    rate: parseFloat(String(d.interestRate ?? "0")),
    minPayment: parseFloat(String(d.monthlyPayment ?? "0")) || 50,
  }));

  const scenario1 = useMemo(() => simulateDebtPayoff(debtInputs, monthlyPayment, strategy), [debtInputs, monthlyPayment, strategy]);
  const scenario2 = useMemo(() => simulateDebtPayoff(debtInputs, monthlyPayment * 1.5, strategy), [debtInputs, monthlyPayment, strategy]);
  const scenario3 = useMemo(() => simulateDebtPayoff(debtInputs, monthlyPayment * 2, strategy), [debtInputs, monthlyPayment, strategy]);

  const formatMonths = (m: number) => {
    if (m === 0) return "Sem dívidas";
    if (m >= 360) return "Mais de 30 anos";
    const years = Math.floor(m / 12);
    const months = m % 12;
    if (years === 0) return `${months} ${months === 1 ? "mês" : "meses"}`;
    if (months === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
    return `${years}a ${months}m`;
  };

  // Merge timelines for chart
  const maxMonths = Math.max(scenario1.timeline.length, scenario2.timeline.length, scenario3.timeline.length);
  const chartData = Array.from({ length: maxMonths }, (_, i) => ({
    month: (scenario1.timeline[i]?.month || scenario2.timeline[i]?.month || scenario3.timeline[i]?.month || 0),
    "Cenário Atual": scenario1.timeline[i]?.totalBalance,
    "Cenário +50%": scenario2.timeline[i]?.totalBalance,
    "Cenário +100%": scenario3.timeline[i]?.totalBalance,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Simulador de Quitação</h1>
        <p className="text-sm text-muted-foreground mt-1">Simule diferentes cenários para quitar suas dívidas</p>
      </div>

      {activeDebts.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Calculator className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhuma dívida ativa</p>
              <p className="text-sm text-muted-foreground mt-1">Cadastre suas dívidas para usar o simulador</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Config */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Configuração do Simulador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Pagamento Mensal Extra</Label>
                    <span className="text-sm font-semibold text-primary font-mono">{formatCurrency(monthlyPayment)}</span>
                  </div>
                  <Slider
                    min={100} max={10000} step={100}
                    value={[monthlyPayment]}
                    onValueChange={([v]) => setMonthlyPayment(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ 100</span>
                    <span>R$ 10.000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CurrencyInput
                      className="h-8 text-xs bg-input border-border/50 w-32"
                      value={monthlyPayment}
                      onChange={v => setMonthlyPayment(v)}
                    />
                    <span className="text-xs text-muted-foreground">ou digite o valor</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Estratégia de Quitação</Label>
                  <Select value={strategy} onValueChange={v => setStrategy(v as Strategy)}>
                    <SelectTrigger className="bg-input border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      <SelectItem value="avalanche">Avalanche (Maior Juros Primeiro)</SelectItem>
                      <SelectItem value="snowball">Bola de Neve (Menor Saldo Primeiro)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                    {strategy === "avalanche"
                      ? "💡 Paga menos juros no total. Ideal para maximizar economia financeira."
                      : "💡 Quita dívidas menores primeiro, gerando motivação psicológica."
                    }
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3" />
                    <span>Saldo disponível: <span className="font-mono text-foreground">{formatCurrency(availableBalance)}</span>/mês</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenarios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Cenário Atual", payment: monthlyPayment, result: scenario1, color: "text-foreground", bg: "bg-card" },
              { label: "Cenário +50%", payment: monthlyPayment * 1.5, result: scenario2, color: "text-blue-400", bg: "bg-blue-400/5" },
              { label: "Cenário +100%", payment: monthlyPayment * 2, result: scenario3, color: "text-primary", bg: "bg-primary/5" },
            ].map(s => (
              <Card key={s.label} className={`border-border/50 ${s.bg}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground font-mono">
                      {formatCurrency(s.payment)}/mês
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tempo para quitar</p>
                        <p className={`text-lg font-semibold ${s.color}`}>{formatMonths(s.result.months)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Juros totais pagos</p>
                        <p className="text-sm font-semibold text-destructive font-mono">{formatCurrency(s.result.totalInterest)}</p>
                      </div>
                    </div>
                    {s.result.debtOrder.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ordem de quitação:</p>
                        <div className="flex flex-wrap gap-1">
                          {s.result.debtOrder.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4 border-border/50 text-muted-foreground">
                              {i + 1}. {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projeção de Evolução das Dívidas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.015 240)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.58 0.015 240)" }} label={{ value: "Meses", position: "insideBottom", offset: -2, fontSize: 11, fill: "oklch(0.58 0.015 240)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "oklch(0.58 0.015 240)" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.24 0.015 240)", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                    <Line type="monotone" dataKey="Cenário Atual" stroke="#94a3b8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Cenário +50%" stroke="#60a5fa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Cenário +100%" stroke="#4ade80" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Debt List */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dívidas Incluídas na Simulação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeDebts.map(debt => (
                  <div key={debt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{debt.creditor}</p>
                        <p className="text-xs text-muted-foreground">{debtTypeLabels[debt.type]} • {parseFloat(String(debt.interestRate ?? "0")).toFixed(2)}% a.m.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive font-mono">{formatCurrency(debt.currentBalance)}</p>
                      {debt.monthlyPayment && <p className="text-xs text-muted-foreground">Parcela: {formatCurrency(debt.monthlyPayment)}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-3">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-sm font-semibold text-destructive font-mono">{formatCurrency(totalDebt)}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
