import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, variableCategoryLabels, fixedCategoryLabels, incomeTypeLabels, categoryColors, monthStartStr, monthEndStr } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History as HistoryIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function History() {
  const [startDate, setStartDate] = useState(monthStartStr());
  const [endDate, setEndDate] = useState(monthEndStr());
  const [filter, setFilter] = useState("all");

  const { data: variable = [] } = trpc.variableExpenses.list.useQuery({ startDate, endDate });
  const { data: income = [] } = trpc.income.list.useQuery({ startDate, endDate });
  const { data: fixed = [] } = trpc.fixedExpenses.list.useQuery();

  const totalIncome = income.reduce((s, i) => s + parseFloat(String(i.amount)), 0);
  const totalVariable = variable.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const totalFixed = fixed.filter(e => e.isActive).reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const totalExpenses = totalVariable + totalFixed;
  const balance = totalIncome - totalExpenses;

  // Build unified timeline
  type Entry = { id: string; date: string; description: string; amount: number; type: "income" | "expense"; category: string; source: string; };
  const entries: Entry[] = [
    ...income.map(i => ({ id: `inc-${i.id}`, date: i.date, description: i.description, amount: parseFloat(String(i.amount)), type: "income" as const, category: i.type, source: "Renda" })),
    ...variable.map(e => ({ id: `var-${e.id}`, date: e.date, description: e.description, amount: parseFloat(String(e.amount)), type: "expense" as const, category: e.category, source: "Variável" })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = filter === "all" ? entries : entries.filter(e => e.type === filter);

  // Monthly chart data - last 6 months
  const months: { month: string; renda: number; gastos: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    months.push({ month: label, renda: 0, gastos: 0 });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão completa de todas as movimentações</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Renda</p>
            <p className="text-xl font-semibold text-primary mt-1 font-mono">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gastos Fixos</p>
            <p className="text-xl font-semibold text-foreground mt-1 font-mono">{formatCurrency(totalFixed)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gastos Variáveis</p>
            <p className="text-xl font-semibold text-foreground mt-1 font-mono">{formatCurrency(totalVariable)}</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${balance >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo</p>
            <p className={`text-xl font-semibold mt-1 font-mono ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(balance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">De:</Label>
          <Input type="date" className="h-8 text-xs bg-input border-border/50 w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Até:</Label>
          <Input type="date" className="h-8 text-xs bg-input border-border/50 w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 text-xs bg-input border-border/50 w-36"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border/50">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Apenas Renda</SelectItem>
            <SelectItem value="expense">Apenas Gastos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <HistoryIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhuma movimentação no período</p>
              <p className="text-sm text-muted-foreground mt-1">Ajuste o filtro de datas ou registre transações</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <Card key={entry.id} className="bg-card border-border/50 hover:border-border transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${entry.type === "income" ? "bg-primary/10" : "bg-secondary"}`}>
                      {entry.type === "income"
                        ? <ArrowUpRight className="w-4 h-4 text-primary" />
                        : <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{formatDate(entry.date)}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 border-border/50 text-muted-foreground">{entry.source}</Badge>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold font-mono shrink-0 ${entry.type === "income" ? "text-primary" : "text-foreground"}`}>
                    {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
