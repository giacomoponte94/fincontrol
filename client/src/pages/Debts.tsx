import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatPercent, formatDate, debtTypeLabels, debtStatusLabels, todayStr } from "@/lib/utils";
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
import { Plus, Pencil, Trash2, CreditCard, TrendingDown, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix", debit: "Débito", credit: "Crédito", cash: "Dinheiro",
  transfer: "Transferência", boleto: "Boleto", other: "Outro",
};
const paymentMethodIcons: Record<string, string> = {
  pix: "💸", debit: "💳", credit: "💴", cash: "💵",
  transfer: "🔄", boleto: "🧾", other: "💰",
};

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

type DebtForm = {
  creditor: string; description: string; type: string; originalAmount: number;
  currentBalance: number; interestRate: string; monthlyPayment: number;
  dueDay: string; startDate: string; expectedEndDate: string; status: string; notes: string;
};

const emptyForm: DebtForm = {
  creditor: "", description: "", type: "credit_card", originalAmount: 0,
  currentBalance: 0, interestRate: "0", monthlyPayment: 0, dueDay: "",
  startDate: todayStr(), expectedEndDate: "", status: "active", notes: "",
};

const statusColors: Record<string, string> = {
  active: "bg-destructive/10 text-destructive border-destructive/20",
  negotiating: "bg-warning/10 text-yellow-400 border-yellow-400/20",
  paused: "bg-muted text-muted-foreground border-border",
  paid: "bg-primary/10 text-primary border-primary/20",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <AlertCircle className="w-3 h-3" />,
  negotiating: <TrendingDown className="w-3 h-3" />,
  paused: <AlertCircle className="w-3 h-3" />,
  paid: <CheckCircle2 className="w-3 h-3" />,
};

export default function Debts() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<DebtForm>(emptyForm);
  const [payOpen, setPayOpen] = useState(false);
  const [payDebtId, setPayDebtId] = useState<number | null>(null);
  const [payForm, setPayForm] = useState({ amount: 0, date: todayStr(), paymentMethod: "", bankName: "", notes: "" });
  const utils = trpc.useUtils();

  const { data: debts = [], isLoading } = trpc.debts.list.useQuery();

  const createMutation = trpc.debts.create.useMutation({
    onSuccess: () => { utils.debts.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Dívida cadastrada!"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.debts.update.useMutation({
    onSuccess: () => { utils.debts.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Dívida atualizada!"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.debts.delete.useMutation({
    onSuccess: () => { utils.debts.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Dívida removida!"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const addPaymentMutation = trpc.debts.addPayment.useMutation({
    onSuccess: () => { utils.debts.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Pagamento registrado!"); setPayOpen(false); setPayForm({ amount: 0, date: todayStr(), paymentMethod: "", bankName: "", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const handleOpenPay = (debtId: number) => {
    setPayDebtId(debtId);
    setPayForm({ amount: 0, date: todayStr(), paymentMethod: "", bankName: "", notes: "" });
    setPayOpen(true);
  };

  const handlePaySubmit = () => {
    if (!payForm.amount || payForm.amount <= 0 || !payDebtId) { toast.error("Informe o valor do pagamento"); return; }
    addPaymentMutation.mutate({
      debtId: payDebtId,
      amount: String(payForm.amount),
      date: payForm.date,
      paymentMethod: (payForm.paymentMethod || undefined) as any,
      bankName: (payForm.bankName || undefined) as any,
      notes: payForm.notes || undefined,
    });
  };

  const handleOpen = (debt?: typeof debts[0]) => {
    if (debt) {
      setEditId(debt.id);
      setForm({
        creditor: debt.creditor, description: debt.description ?? "",
        type: debt.type, originalAmount: Number(debt.originalAmount),
        currentBalance: Number(debt.currentBalance), interestRate: String(debt.interestRate ?? "0"),
        monthlyPayment: Number(debt.monthlyPayment ?? 0), dueDay: String(debt.dueDay ?? ""),
        startDate: debt.startDate ?? todayStr(), expectedEndDate: debt.expectedEndDate ?? "",
        status: debt.status, notes: debt.notes ?? "",
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.creditor || !form.currentBalance) { toast.error("Preencha os campos obrigatórios"); return; }
    const payload = {
      creditor: form.creditor, description: form.description || undefined,
      type: form.type as any, originalAmount: String(form.originalAmount || form.currentBalance),
      currentBalance: String(form.currentBalance), interestRate: form.interestRate || "0",
      monthlyPayment: form.monthlyPayment ? String(form.monthlyPayment) : undefined, dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
      startDate: form.startDate || undefined, expectedEndDate: form.expectedEndDate || undefined,
      status: form.status as any, notes: form.notes || undefined,
    };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const totalDebt = debts.filter(d => d.status === "active" || d.status === "negotiating")
    .reduce((s, d) => s + parseFloat(String(d.currentBalance)), 0);
  const activeDebts = debts.filter(d => d.status === "active").length;
  const paidDebts = debts.filter(d => d.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Dívidas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie e acompanhe todas as suas dívidas</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Dívida
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total em Dívidas</p>
            <p className="text-2xl font-semibold text-destructive mt-1 font-mono">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Dívidas Ativas</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{activeDebts}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Quitadas</p>
            <p className="text-2xl font-semibold text-primary mt-1">{paidDebts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Debts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border/50" />)}
        </div>
      ) : debts.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhuma dívida cadastrada</p>
              <p className="text-sm text-muted-foreground mt-1">Adicione suas dívidas para começar o controle</p>
            </div>
            <Button onClick={() => handleOpen()} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Adicionar Dívida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const balance = parseFloat(String(debt.currentBalance));
            const original = parseFloat(String(debt.originalAmount));
            const paidPct = original > 0 ? Math.max(0, Math.min(100, ((original - balance) / original) * 100)) : 0;
            return (
              <Card key={debt.id} className="bg-card border-border/50 hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{debt.creditor}</h3>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 gap-1 ${statusColors[debt.status]}`}>
                          {statusIcons[debt.status]}
                          {debtStatusLabels[debt.status]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground border-border/50">
                          {debtTypeLabels[debt.type]}
                        </Badge>
                      </div>
                      {debt.description && <p className="text-xs text-muted-foreground mt-0.5">{debt.description}</p>}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div>
                          <span className="text-xs text-muted-foreground">Saldo: </span>
                          <span className="text-sm font-semibold text-destructive font-mono">{formatCurrency(balance)}</span>
                        </div>
                        {parseFloat(String(debt.interestRate)) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Juros: </span>
                            <span className="text-sm font-medium text-yellow-400">{formatPercent(debt.interestRate)}a.m.</span>
                          </div>
                        )}
                        {debt.monthlyPayment && parseFloat(String(debt.monthlyPayment)) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Parcela: </span>
                            <span className="text-sm font-medium text-foreground font-mono">{formatCurrency(debt.monthlyPayment)}</span>
                          </div>
                        )}
                        {debt.dueDay && (
                          <div>
                            <span className="text-xs text-muted-foreground">Venc.: </span>
                            <span className="text-sm text-foreground">dia {debt.dueDay}</span>
                          </div>
                        )}
                      </div>
                      {debt.status !== "paid" && original > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Progresso</span>
                            <span>{paidPct.toFixed(0)}% pago</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {debt.status !== "paid" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Registrar pagamento" onClick={() => handleOpenPay(debt.id)}>
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpen(debt)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(debt.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? "Editar Dívida" : "Nova Dívida"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Credor *</Label>
                <Input className="mt-1 bg-input border-border/50" placeholder="Ex: Nubank, Bradesco..." value={form.creditor} onChange={e => setForm(f => ({...f, creditor: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tipo *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {Object.entries(debtTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {Object.entries(debtStatusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor Original</Label>
                <CurrencyInput className="mt-1 bg-input border-border/50" placeholder="0,00" value={form.originalAmount} onChange={v => setForm(f => ({...f, originalAmount: v}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Saldo Atual *</Label>
                <CurrencyInput className="mt-1 bg-input border-border/50" placeholder="0,00" value={form.currentBalance} onChange={v => setForm(f => ({...f, currentBalance: v}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Juros Mensal (%)</Label>
                <Input className="mt-1 bg-input border-border/50" type="number" placeholder="0,00" value={form.interestRate} onChange={e => setForm(f => ({...f, interestRate: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Parcela Mensal</Label>
                <CurrencyInput className="mt-1 bg-input border-border/50" placeholder="0,00" value={form.monthlyPayment} onChange={v => setForm(f => ({...f, monthlyPayment: v}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Dia de Vencimento</Label>
                <Input className="mt-1 bg-input border-border/50" type="number" min="1" max="31" placeholder="Ex: 10" value={form.dueDay} onChange={e => setForm(f => ({...f, dueDay: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data de Início</Label>
                <Input className="mt-1 bg-input border-border/50" type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <Textarea className="mt-1 bg-input border-border/50 resize-none" rows={2} placeholder="Notas sobre esta dívida..." value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm bg-card border-border/50">
          <DialogHeader><DialogTitle className="font-display">Registrar Pagamento</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Valor Pago *</Label>
                <CurrencyInput className="mt-1 bg-input border-border/50" placeholder="0,00" value={payForm.amount} onChange={v => setPayForm(f => ({...f, amount: v}))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data *</Label>
                <Input className="mt-1 bg-input border-border/50" type="date" value={payForm.date} onChange={e => setPayForm(f => ({...f, date: e.target.value}))} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
              <Select value={payForm.paymentMethod} onValueChange={v => setPayForm(f => ({...f, paymentMethod: v}))}>
                <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {Object.entries(paymentMethodLabels).map(([v, l]) => <SelectItem key={v} value={v}>{paymentMethodIcons[v]} {l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Banco / Instituição</Label>
              <Select value={payForm.bankName} onValueChange={v => setPayForm(f => ({...f, bankName: v}))}>
                <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue placeholder="Selecionar banco..." /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {Object.entries(bankNameLabels).map(([v, l]) => <SelectItem key={v} value={v}>{bankNameIcons[v]} {l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea className="mt-1 bg-input border-border/50 resize-none" rows={2} placeholder="Notas sobre este pagamento..." value={payForm.notes} onChange={e => setPayForm(f => ({...f, notes: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button onClick={handlePaySubmit} disabled={addPaymentMutation.isPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover dívida?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
