import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, incomeTypeLabels, todayStr, monthStartStr, monthEndStr } from "@/lib/utils";
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
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Form = { description: string; amount: number; type: string; date: string; isRecurring: boolean; notes: string; };
const emptyForm: Form = { description: "", amount: 0, type: "salary", date: todayStr(), isRecurring: false, notes: "" };

const typeColors: Record<string, string> = {
  salary: "text-primary bg-primary/10 border-primary/20",
  freelance: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  business: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  investment: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  other: "text-muted-foreground bg-muted border-border",
};

export default function Income() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [startDate, setStartDate] = useState(monthStartStr());
  const [endDate, setEndDate] = useState(monthEndStr());
  const utils = trpc.useUtils();

  const { data: incomes = [], isLoading } = trpc.income.list.useQuery({ startDate, endDate });

  const createMutation = trpc.income.create.useMutation({
    onSuccess: () => { utils.income.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Renda registrada!"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.income.update.useMutation({
    onSuccess: () => { utils.income.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Renda atualizada!"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.income.delete.useMutation({
    onSuccess: () => { utils.income.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("Renda removida!"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleOpen = (inc?: typeof incomes[0]) => {
    if (inc) {
      setEditId(inc.id);
      setForm({ description: inc.description, amount: Number(inc.amount), type: inc.type, date: inc.date, isRecurring: inc.isRecurring, notes: inc.notes ?? "" });
    } else { setEditId(null); setForm({ ...emptyForm, date: todayStr() }); }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.description || !form.amount) { toast.error("Preencha os campos obrigatórios"); return; }
    const payload = { description: form.description, amount: String(form.amount), type: form.type as any, date: form.date, isRecurring: form.isRecurring, notes: form.notes || undefined };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const total = incomes.reduce((s, i) => s + parseFloat(String(i.amount)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Renda</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre suas entradas de dinheiro</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> Registrar Renda</Button>
      </div>

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
          Total: <span className="font-semibold text-primary ml-1 font-mono">{formatCurrency(total)}</span>
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card rounded-xl animate-pulse border border-border/50" />)}</div>
      ) : incomes.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhuma renda no período</p>
              <p className="text-sm text-muted-foreground mt-1">Registre suas entradas de dinheiro</p>
            </div>
            <Button onClick={() => handleOpen()} variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Registrar</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {incomes.map(inc => (
            <Card key={inc.id} className="bg-card border-border/50 hover:border-border transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{inc.description}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${typeColors[inc.type]}`}>{incomeTypeLabels[inc.type]}</Badge>
                      {inc.isRecurring && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground border-border/50">Recorrente</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(inc.date)}</span>
                    {inc.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{inc.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-semibold text-primary font-mono">{formatCurrency(inc.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpen(inc)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(inc.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Editar Renda" : "Registrar Renda"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Descrição *</Label>
              <Input className="mt-1 bg-input border-border/50" placeholder="Ex: Salário, Projeto X..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
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
            <div>
              <Label className="text-xs text-muted-foreground">Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                <SelectTrigger className="mt-1 bg-input border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {Object.entries(incomeTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isRecurring} onCheckedChange={v => setForm(f => ({...f, isRecurring: v}))} />
              <Label className="text-xs text-muted-foreground">Renda recorrente (mensal)</Label>
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
          <AlertDialogHeader><AlertDialogTitle>Remover renda?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
