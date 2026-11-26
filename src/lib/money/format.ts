const integerFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

// Espaço que não quebra linha, para "R$" nunca se separar do número.
const NBSP = " ";

// Centavos inteiros para "R$ 1.234,56". Reais e centavos são separados por divisão inteira:
// o valor nunca vira número fracionário.
export function formatCents(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError("Valor em centavos precisa ser um inteiro.");
  }

  const absolute = Math.abs(cents);
  const reais = integerFormat.format(Math.trunc(absolute / 100));
  const centavos = String(absolute % 100).padStart(2, "0");
  const sign = cents < 0 ? "-" : "";

  return `${sign}R$${NBSP}${reais},${centavos}`;
}
