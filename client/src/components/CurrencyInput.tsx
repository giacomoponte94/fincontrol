import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

/**
 * CurrencyInput — campo monetário no padrão brasileiro (R$ 1.234,56).
 * Internamente armazena o valor como número (centavos inteiros divididos por 100).
 * Exibe sempre com vírgula como separador decimal e ponto como separador de milhar.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className,
  disabled,
  id,
  name,
}: CurrencyInputProps) {
  // Converte o valor numérico para string formatada BRL
  const formatToBRL = (num: number): string => {
    if (!num && num !== 0) return "";
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [displayValue, setDisplayValue] = useState<string>(
    value !== "" && value !== undefined && value !== null
      ? formatToBRL(Number(value))
      : ""
  );

  // Sincroniza quando o valor externo muda (ex: reset de formulário)
  useEffect(() => {
    const num = Number(value);
    if (!isNaN(num) && num !== parseFloat(displayValue.replace(/\./g, "").replace(",", "."))) {
      setDisplayValue(num === 0 ? "" : formatToBRL(num));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Remove tudo que não for dígito
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    // Trata os dígitos como centavos (os últimos 2 são decimais)
    const cents = parseInt(digits, 10);
    const numericValue = cents / 100;

    const formatted = numericValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setDisplayValue(formatted);
    onChange(numericValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite: backspace, delete, tab, escape, enter, setas
    const allowed = [
      "Backspace", "Delete", "Tab", "Escape", "Enter",
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End",
    ];
    if (allowed.includes(e.key)) return;
    // Permite apenas dígitos
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      disabled={disabled}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}
