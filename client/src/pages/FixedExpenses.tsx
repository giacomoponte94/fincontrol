import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, fixedCategoryLabels } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Form = { name: string; category: string; amount: number; dueDay: string; paymentMethod: string; bankName: string; isActive: boolean; notes: string; };
const emptyForm: Form = { name: "", category: "housing", amount: 0, dueDay: "", paymentMethod: "", bankName: "", isActive: true, notes: "" };

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

const categoryColors: Record<string, string> = {
  housing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  health: "text-green-400 bg-green-400/10 border-green-400/20",
  insurance: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  transport: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  education: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  utilities: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  subscription: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  tax: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  other: "text-muted-foreground bg-muted border-border",
};

export default function FixedExpenses() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const utils = trpc.useUtils();

  const { data: expenses = [], isLoading } = trpc.fixedExpenses.list.useQuery();

  const createMutation = trpc.fixedExpenses.create.useMutation({
    onSuccess: () => { utils.fixedExpenses.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Gasto fixo cadastrado!"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.fixedExpenses.update.useMutation({
    onSuccess: () => { utils.fixedExpenses.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Gasto fixo atualizado!"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.fixedExpenses.delete.useMutation({
    onSuccess: () => { utils.fixedExpenses.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Gasto fixo removido!"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleOpen = (exp?: typeof expenses[0]) => {
    if (exp) {
      setEditId(exp.id);
      setForm({ name: exp.name, category: exp.category, amount: Number(exp.amount), dueDay: String(exp.dueDay ?? ""), paymentMethod: exp.paymentMethod ?? "", bankName: (exp as any).bankName ?? "", isActive: exp.isActive, notes: exp.notes ?? "" });
    } else { setEditId(null); setForm(emptyForm); }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.amount) { toast.error("Preencha os campos obrigatórios"); return; }
    const payload = { name: form.name, category: form.category as any, amount: String(form.amount), dueDay: form.dueDay ? parseInt(form.dueDay) : undefined, paymentMethod: (form.paymentMethod || undefined) as any, bankName: (form.bankName || undefined) as any, isActive: form.isActive, notes: form.notes || undefined };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const activeExpenses = expenses.filter(e => e.isActive);
  const totalActive = activeExpenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);
  const totalAll = expenses.reduce((s, e) => s + parseFloat(String(e.amount)), 0);

  // Group by category
  const byCategory = expenses.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {} as Record<string, typeof expenses>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Gastos Fixos</h1>
          <p className="text-sm text-muted-foreground mt-1">Compromissos mensais recorrentes</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Gasto Fixo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Ativo/Mês</p>
            <p className="text-2xl font-semibold text-foreground mt-1 font-mono">{formatCurrency(totalActive)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Itens Ativos</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{activeExpenses.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cadastrado</p>
            <p className="text-2xl font-semibold text-muted-foreground mt-1 font-mono">{formatCurrency(totalAll)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-card rounded-xl animate-pulse border border-border/50" />)}</div>
      ) : expenses.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhum gasto fixo cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">Adicione seus compromissos mensais</p>
            </div>
            <Button onClick={() => handleOpen()} variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-xs ${categoryColors[cat]}`}>{fixedCategoryLabels[cat]}</Badge>
                <span className="text-xs text-muted-foreground font-mono">{formatCurrency(items.reduce((s, e) => s + parseFloat(String(e.amount)), 0))}</span>
              </div>
              <div className="space-y-2">
                {items.map(exp => (
                  <Card key={exp.id} className={`bg-card border-border/50 hover:border-border transition-colors ${!exp.isActive ? "opacity-50" : ""}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{exp.name}</span>
                            {!exp.isActive && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">Inativo</Badge>}
                            {exp.dueDay && <span className="text-xs text-muted-foreground">• vence dia {exp.dueDay}</span>}
                            {exp.paymentMethod && <span className="text-xs text-muted-foreground">• {paymentMethodIcons[exp.paymentMethod]} {paymentMethodLabels[exp.paymentMethod]}</span>}
                            {(exp as any).bankName && <span className="text-xs text-muted-foreground">• {bankNameIcons[(exp as any).bankName]} {bankNameLabels[(exp as any).bankName]}</span>}
                          </div>
                          {exp.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{exp.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold font-mono text-foreground">{formatCurrency(exp.amount)}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpen(exp)}><Pencil className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(exp.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Editar Gasto Fixo" : "Novo Gasto Fixo"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input className="mt-1 bg-input border-border/50" placeholder="Ex: Plano de Saúde, Aluguel..." value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Categoria *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {Object.entries(fixedCategoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor Mensal *</Label>
                <CurrencyInput className="mt-1 bg-input border-border/50" placeholder="0,00" value={form.amount} onChange={v => setForm(f => ({...f, amount: v}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Dia de Vencimento</Label>
                <Input className="mt-1 bg-input border-border/50" type="number" min="1" max="31" placeholder="Ex: 10" value={form.dueDay} onChange={e => setForm(f => ({...f, dueDay: e.target.value}))} />
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
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({...f, isActive: v}))} />
              <Label className="text-xs text-muted-foreground">Gasto ativo</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea className="mt-1 bg-input border-border/50 resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader><AlertDialogTitle>Remover gasto fixo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
