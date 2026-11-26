// Maior valor aceito em uma movimentação: R$ 999.999.999,99.
export const MAX_AMOUNT_CENTS = 99_999_999_999;

// "150", "150,5", "150,50", "1.234,56" e "R$ 1.234,56". O ponto só vale como separador de
// milhar, em grupos de três dígitos; a vírgula separa os centavos.
const BRL_PATTERN = /^(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

// Como `parseAmountToCents`, mas aceita o sinal de menos na frente (saldo inicial negativo).
export function parseSignedAmountToCents(text: string): number | null {
  const trimmed = text.trim();
  const negative = trimmed.startsWith("-");
  const cents = parseAmountToCents(negative ? trimmed.slice(1) : trimmed);

  if (cents === null) return null;
  return negative ? -cents : cents;
}

// Converte o texto digitado em centavos inteiros, sem passar por ponto flutuante (TRANS-006).
// Devolve `null` para texto que não é um valor em reais ou que passa do limite.
export function parseAmountToCents(text: string): number | null {
  const match = BRL_PATTERN.exec(text.trim());
  if (!match) return null;

  const reaisDigits = (match[1] ?? "").replaceAll(".", "");
  // Com mais de dez dígitos o valor já passou do limite, e a conta sairia da faixa segura.
  if (reaisDigits.length > 10) return null;

  // Só inteiros: reais × 100 + centavos.
  const cents =
    Number(reaisDigits) * 100 + Number((match[2] ?? "").padEnd(2, "0"));

  if (cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}
