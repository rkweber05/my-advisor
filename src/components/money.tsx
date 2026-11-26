import { formatCents } from "@/lib/money/format";
import { cn } from "@/lib/utils";

type MoneyProps = {
  cents: number;
  // "result": negativo em vermelho com sinal, positivo sem cor. "income": verde com sinal de mais.
  tone?: "plain" | "result" | "income";
  className?: string;
};

// Valor em reais com dígitos alinhados. A cor nunca vai sozinha: sempre acompanha um sinal
// (DESIGN.md, regras de cor).
export function Money({ cents, tone = "plain", className }: MoneyProps) {
  const negative = tone === "result" && cents < 0;
  const text =
    tone === "income" ? `+${formatCents(cents)}` : formatCents(cents);

  return (
    <span
      className={cn(
        "font-medium whitespace-nowrap tabular-nums",
        negative && "text-danger-strong",
        tone === "income" && "text-success-strong",
        className,
      )}
    >
      {text}
    </span>
  );
}
