import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${num.toFixed(2)}%`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch { return dateStr; }
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function monthStartStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthEndStr(): string {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export const debtTypeLabels: Record<string, string> = {
  credit_card: "Cartão de Crédito", personal_loan: "Empréstimo Pessoal",
  bank_loan: "Empréstimo Bancário", financing: "Financiamento",
  overdraft: "Cheque Especial", revolving: "Crédito Rotativo",
  friend_family: "Amigos/Família", other: "Outro",
};

export const debtStatusLabels: Record<string, string> = {
  active: "Ativo", negotiating: "Negociando", paused: "Pausado", paid: "Quitado",
};

export const fixedCategoryLabels: Record<string, string> = {
  housing: "Moradia", health: "Saúde", insurance: "Seguros", transport: "Transporte",
  education: "Educação", utilities: "Utilidades", subscription: "Assinatura",
  tax: "Impostos", other: "Outro",
};

export const variableCategoryLabels: Record<string, string> = {
  food: "Alimentação", transport: "Transporte", leisure: "Lazer", shopping: "Compras",
  health: "Saúde", education: "Educação", personal: "Pessoal", other: "Outro",
};

export const incomeTypeLabels: Record<string, string> = {
  salary: "Salário", freelance: "Freelance", business: "Negócio",
  investment: "Investimento", other: "Outro",
};

export const categoryColors: Record<string, string> = {
  food: "#4ade80", transport: "#60a5fa", leisure: "#f472b6", shopping: "#fb923c",
  health: "#34d399", education: "#a78bfa", personal: "#fbbf24", other: "#94a3b8",
  housing: "#60a5fa", insurance: "#f472b6", utilities: "#fbbf24",
  subscription: "#a78bfa", tax: "#fb923c",
};
