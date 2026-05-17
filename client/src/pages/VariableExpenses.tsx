import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, variableCategoryLabels, categoryColors, todayStr, monthStartStr, monthEndStr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Form = { description: string; amount: number; category: string; date: string; paymentMethod: string; bankName: string; notes: string; };
const emptyForm: Form = { description: "", amount: 0, category: "food", date: todayStr(), paymentMethod: "", bankName: "", notes: "" };

const bankNameLabels: Record<string, string> = {
  bradesco: "Bradesco", santander: "Santander", itau: "Itaú", caixa: "Caixa",
  banco_brasil: "Banco do Brasil", nubank: "Nubank", inter: "Inter", c6: "C6",
  mercado_pago: "Mercado Pago", xp: "XP", other: "Outro",
};

const bankNameIcons: Record<string, string> = {
  bradesco: "🔴", santander: "🔥", itau: "🟠", caixa: "🔵",
  banco_brasil: "🟡", nubank: "🟣", inter: "🟠", c6: "⚫",
  mercado_pago: "🔷", xp: "🟢", other: "🏦",
};

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix", debit: "Débito", credit: "Crédito", cash: "Dinheiro",
  transfer: "Transferência", boleto: "Boleto", other: "Outro",
};

const paymentMethodIcons: Record<string, string> = {
  pix: "💸", debit: "💳", credit: "💴", cash: "💵",
  transfer: "🔄", boleto: "🧾", other: "💰",
};

export default function VariableExpenses() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [startDate, setStartDate] = useState(monthStartStr());
  const [endDate, setEndDate] = useState(monthEndStr());
  const utils = trpc.useUtils();

  const { data: expenses = [], isLoading } = trpc.variableExpenses.list.useQuery({ startDate, endDate });

  const createMutation = trpc.variableExpenses.create.useMutation({
    onSuccess: () => { utils.variableExpenses.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Gasto registrado!"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.variableExpenses.update.useMutation({
    onSuccess: () => { utils.variableExpenses.list.invalidate(); toast.success("Gasto atualizado!"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.variableExpenses.delete.useMutation({
    onSuccess: () => { utils.variableExpenses.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Gasto removido!"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleOpen = (exp?: typeof expenses[0]) => {
    if (exp) {
      setEditId(exp.id);
      setForm({ description: exp.description, amount: Number(exp.amount), category: exp.category, date: exp.date, paymentMethod: exp.paymentMethod ?? "", bankName: (exp as any).bankName ?? "", notes: exp.notes ?? "" });
    } else { setEditId(null); setForm({ ...emptyForm, date: todayStr() }); }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.description || !form.amount) { toast.error("Preencha os campos obrigatórios"); return; }

    const payload = { description: form.description, amount: String(form.amount), category: form.category as any, date: form.date, paymentMethod: (form.paymentMethod || undefined) as any, bankName: (form.bankName || undefined) as any, notes: form.notes || undefined };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const total = expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);

  // Chart data
  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category;
    acc[cat] = (acc[cat] || 0) + parseFloat(String(e.amount));
    return acc;
  }, {} as Record<string, number>);
  const chartData = Object.entries(byCategory).map(([name, value]) => ({ name: variableCategoryLabels[name] || name, value, color: categoryColors[name] || "#94a3b8" }));

  // Group by date
  const byDate = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {} as Record<string, typeof expenses>);
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Gastos Variáveis</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre gastos do dia a dia</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> Registrar Gasto</Button>
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
        <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
          Total: <span className="font-semibold text-foreground ml-1 font-mono">{formatCurrency(total)}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.24 0.015 240)", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {chartData.sort((a, b) => b.value - a.value).map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-mono text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className={`space-y-4 ${chartData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card rounded-xl animate-pulse border border-border/50" />)}</div>
          ) : expenses.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Nenhum gasto no período</p>
                  <p className="text-sm text-muted-foreground mt-1">Registre seus gastos do dia a dia</p>
                </div>
                <Button onClick={() => handleOpen()} variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Registrar</Button>
              </CardContent>
            </Card>
          ) : (
            sortedDates.map(date => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{formatDate(date)}</span>
                  <span className="text-xs font-mono text-muted-foreground">{formatCurrency(byDate[date].reduce((s, e) => s + parseFloat(String(e.amount)), 0))}</span>
                </div>
                <div className="space-y-1.5">
                  {byDate[date].map(exp => (
                    <Card key={exp.id} className="bg-card border-border/50 hover:border-border transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: categoryColors[exp.category] || "#94a3b8" }} />
                            <div className="min-w-0">
                              <span className="text-sm text-foreground truncate block">{exp.description}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">{variableCategoryLabels[exp.category]}</span>
                                {exp.paymentMethod && (
                                  <span className="text-[10px] text-muted-foreground/70">· {paymentMethodIcons[exp.paymentMethod]} {paymentMethodLabels[exp.paymentMethod]}</span>
                                )}
                                {(exp as any).bankName && (
                                  <span className="text-[10px] text-muted-foreground/70">· {bankNameIcons[(exp as any).bankName]} {bankNameLabels[(exp as any).bankName]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold font-mono text-foreground">{formatCurrency(exp.amount)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleOpen(exp)}><Pencil className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(exp.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Editar Gasto" : "Registrar Gasto"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Descrição *</Label>
              <Input className="mt-1 bg-input border-border/50" placeholder="Ex: Almoço, Uber, Farmácia..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Valor *</Label>
                <CurrencyInput className="mt-1 bg-input border-border/50" placeholder="0,00" value={form.amount} onChange={v => setForm(f => ({...f, amount: v}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data *</Label>
                <Input className="mt-1 bg-input border-border/50" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Categoria *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {Object.entries(variableCategoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({...f, paymentMethod: v}))}>
                  <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {Object.entries(paymentMethodLabels).map(([v, l]) => <SelectItem key={v} value={v}>{paymentMethodIcons[v]} {l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Banco / Instituição</Label>
              <Select value={form.bankName} onValueChange={v => setForm(f => ({...f, bankName: v}))}>
                <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue placeholder="Selecionar banco..." /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {Object.entries(bankNameLabels).map(([v, l]) => <SelectItem key={v} value={v}>{bankNameIcons[v]} {l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea className="mt-1 bg-input border-border/50 resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editId ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader><AlertDialogTitle>Remover gasto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
