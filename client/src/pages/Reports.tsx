import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, debtTypeLabels, fixedCategoryLabels, variableCategoryLabels, monthStartStr, monthEndStr } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, TrendingUp, TrendingDown, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [startDate, setStartDate] = useState(monthStartStr());
  const [endDate, setEndDate] = useState(monthEndStr());
  const [generating, setGenerating] = useState(false);

  const { data: debts = [] } = trpc.debts.list.useQuery();
  const { data: fixed = [] } = trpc.fixedExpenses.list.useQuery();
  const { data: variable = [] } = trpc.variableExpenses.list.useQuery({ startDate, endDate });
  const { data: income = [] } = trpc.income.list.useQuery({ startDate, endDate });
  const { data: summary } = trpc.dashboard.summary.useQuery();

  const totalIncome = income.reduce((s, i) => s + parseFloat(String(i.amount)), 0);
  const totalVariable = variable.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const totalFixed = fixed.filter(e => e.isActive).reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const totalDebt = debts.filter(d => d.status === "active" || d.status === "negotiating").reduce((s, d) => s + parseFloat(String(d.currentBalance)), 0);
  const balance = totalIncome - totalFixed - totalVariable;

  // Category breakdown for variable expenses
  const varByCategory = variable.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(String(e.amount));
    return acc;
  }, {} as Record<string, number>);

  const handleExportPDF = async () => {
    setGenerating(true);
    try {
      // Build report content as HTML for printing
      const reportDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      const periodLabel = `${formatDate(startDate)} a ${formatDate(endDate)}`;

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro - FinControlling</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: white; padding: 40px; font-size: 13px; }
    .header { border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #16a34a; font-weight: 700; }
    .header p { color: #666; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 16px; font-weight: 700; color: #1a1a2e; border-left: 4px solid #16a34a; padding-left: 10px; margin-bottom: 14px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .kpi-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .kpi-card.income .value { color: #16a34a; }
    .kpi-card.expense .value { color: #374151; }
    .kpi-card.balance .value { color: ${balance >= 0 ? "#16a34a" : "#dc2626"}; }
    .kpi-card.debt .value { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .badge-gray { background: #f1f5f9; color: #64748b; }
    .total-row td { font-weight: 700; background: #f8fafc; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
    .alert-box p { color: #dc2626; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FinControlling — Relatório Financeiro</h1>
    <p>Gerado em ${reportDate} &nbsp;|&nbsp; Período: ${periodLabel}</p>
  </div>

  <div class="section">
    <h2>Resumo Executivo</h2>
    <div class="kpi-grid">
      <div class="kpi-card income"><div class="label">Renda Total</div><div class="value">${formatCurrency(totalIncome)}</div></div>
      <div class="kpi-card expense"><div class="label">Total de Gastos</div><div class="value">${formatCurrency(totalFixed + totalVariable)}</div></div>
      <div class="kpi-card balance"><div class="label">Saldo do Período</div><div class="value">${formatCurrency(balance)}</div></div>
      <div class="kpi-card debt"><div class="label">Total em Dívidas</div><div class="value">${formatCurrency(totalDebt)}</div></div>
    </div>
    ${balance < 0 ? `<div class="alert-box"><p>⚠️ Atenção: Você está com déficit de ${formatCurrency(Math.abs(balance))} neste período. Seus gastos superam sua renda.</p></div>` : ""}
  </div>

  ${income.length > 0 ? `
  <div class="section">
    <h2>Renda do Período</h2>
    <table>
      <thead><tr><th>Descrição</th><th>Data</th><th>Tipo</th><th>Valor</th></tr></thead>
      <tbody>
        ${income.map(i => `<tr><td>${i.description}</td><td>${formatDate(i.date)}</td><td><span class="badge badge-green">${i.type}</span></td><td><strong>${formatCurrency(i.amount)}</strong></td></tr>`).join("")}
        <tr class="total-row"><td colspan="3">Total</td><td>${formatCurrency(totalIncome)}</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${fixed.length > 0 ? `
  <div class="section">
    <h2>Gastos Fixos Mensais</h2>
    <table>
      <thead><tr><th>Nome</th><th>Categoria</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr></thead>
      <tbody>
        ${fixed.map(e => `<tr><td>${e.name}</td><td>${fixedCategoryLabels[e.category] || e.category}</td><td>${e.dueDay ? `Dia ${e.dueDay}` : "-"}</td><td><span class="badge ${e.isActive ? "badge-blue" : "badge-gray"}">${e.isActive ? "Ativo" : "Inativo"}</span></td><td><strong>${formatCurrency(e.amount)}</strong></td></tr>`).join("")}
        <tr class="total-row"><td colspan="4">Total Ativo</td><td>${formatCurrency(totalFixed)}</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${variable.length > 0 ? `
  <div class="section">
    <h2>Gastos Variáveis do Período</h2>
    <table>
      <thead><tr><th>Descrição</th><th>Data</th><th>Categoria</th><th>Valor</th></tr></thead>
      <tbody>
        ${variable.map(e => `<tr><td>${e.description}</td><td>${formatDate(e.date)}</td><td>${variableCategoryLabels[e.category] || e.category}</td><td>${formatCurrency(e.amount)}</td></tr>`).join("")}
        <tr class="total-row"><td colspan="3">Total</td><td>${formatCurrency(totalVariable)}</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${debts.length > 0 ? `
  <div class="section">
    <h2>Situação das Dívidas</h2>
    <table>
      <thead><tr><th>Credor</th><th>Tipo</th><th>Saldo Atual</th><th>Juros/mês</th><th>Parcela</th><th>Status</th></tr></thead>
      <tbody>
        ${debts.map(d => `<tr><td><strong>${d.creditor}</strong></td><td>${debtTypeLabels[d.type] || d.type}</td><td style="color:#dc2626;font-weight:700">${formatCurrency(d.currentBalance)}</td><td>${parseFloat(String(d.interestRate ?? "0")).toFixed(2)}%</td><td>${d.monthlyPayment ? formatCurrency(d.monthlyPayment) : "-"}</td><td><span class="badge ${d.status === "paid" ? "badge-green" : d.status === "active" ? "badge-red" : "badge-gray"}">${d.status === "paid" ? "Quitado" : d.status === "active" ? "Ativo" : d.status}</span></td></tr>`).join("")}
        <tr class="total-row"><td colspan="2">Total em Dívidas</td><td style="color:#dc2626">${formatCurrency(totalDebt)}</td><td colspan="3"></td></tr>
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <p>Relatório gerado pelo FinControlling — Sistema de Gestão Financeira Pessoal</p>
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
        toast.success("Relatório aberto! Use Ctrl+P para salvar como PDF.");
      } else {
        toast.error("Bloqueador de pop-up ativo. Permita pop-ups para este site.");
      }
    } catch (e) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise detalhada da sua situação financeira</p>
        </div>
        <Button onClick={handleExportPDF} disabled={generating} className="gap-2">
          <Download className="w-4 h-4" />
          {generating ? "Gerando..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Period Filter */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Período:</Label>
              <Input type="date" className="h-8 text-xs bg-input border-border/50 w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-xs text-muted-foreground">até</span>
              <Input type="date" className="h-8 text-xs bg-input border-border/50 w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Renda</p></div>
            <p className="text-xl font-semibold text-primary font-mono">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Gastos Fixos</p></div>
            <p className="text-xl font-semibold text-foreground font-mono">{formatCurrency(totalFixed)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-pink-400" /><p className="text-xs text-muted-foreground">Gastos Variáveis</p></div>
            <p className="text-xl font-semibold text-foreground font-mono">{formatCurrency(totalVariable)}</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 ${balance >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {balance >= 0 ? <TrendingUp className="w-4 h-4 text-primary" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
              <p className="text-xs text-muted-foreground">Saldo</p>
            </div>
            <p className={`text-xl font-semibold font-mono ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(balance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Debt Summary */}
      {debts.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Situação das Dívidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debts.map(debt => (
                <div key={debt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{debt.creditor}</p>
                    <p className="text-xs text-muted-foreground">{debtTypeLabels[debt.type]}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold font-mono ${debt.status === "paid" ? "text-primary" : "text-destructive"}`}>{formatCurrency(debt.currentBalance)}</p>
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${debt.status === "paid" ? "text-primary border-primary/20" : "text-destructive border-destructive/20"}`}>
                      {debt.status === "paid" ? "Quitado" : debt.status === "active" ? "Ativo" : debt.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between px-3">
                <span className="text-sm font-medium text-muted-foreground">Total em Dívidas</span>
                <span className="text-sm font-semibold text-destructive font-mono">{formatCurrency(totalDebt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variable by Category */}
      {Object.keys(varByCategory).length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Variáveis por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(varByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                const pct = totalVariable > 0 ? (val / totalVariable) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{variableCategoryLabels[cat] || cat}</span>
                      <span className="font-mono text-foreground">{formatCurrency(val)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Exportar Relatório Completo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gera um relatório detalhado em PDF com todos os dados do período selecionado</p>
            </div>
          </div>
          <Button onClick={handleExportPDF} disabled={generating} className="shrink-0 gap-2">
            <Download className="w-4 h-4" />
            {generating ? "Gerando..." : "Gerar PDF"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
