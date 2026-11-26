import { describe, expect, it } from "vitest";

import { formatCents } from "@/lib/money/format";
import { MAX_AMOUNT_CENTS, parseAmountToCents } from "@/lib/money/parse";

describe("parseAmountToCents", () => {
  it.each([
    ["150", 15000],
    ["150,5", 15050],
    ["150,50", 15050],
    ["0,01", 1],
    ["0,10", 10],
    ["1.234,56", 123456],
    ["1.234", 123400],
    ["R$ 1.234,56", 123456],
    ["R$1.234,56", 123456],
    ["  19,90  ", 1990],
    ["0", 0],
    ["999.999.999,99", MAX_AMOUNT_CENTS],
  ])("lê %s como %i centavos", (text, cents) => {
    expect(parseAmountToCents(text)).toBe(cents);
  });

  // 0,1 + 0,2 e 1,1 × 100 são os casos clássicos em que o ponto flutuante erra.
  it.each([
    ["0,29", 29],
    ["1,10", 110],
    ["4,35", 435],
    ["1.005,01", 100501],
    ["8.192,13", 819213],
  ])("não perde centavo em %s", (text, cents) => {
    expect(parseAmountToCents(text)).toBe(cents);
  });

  it.each([
    ["vazio", ""],
    ["texto", "abc"],
    ["negativo", "-10,00"],
    ["três casas decimais", "1,234"],
    ["ponto como decimal", "150.50"],
    ["milhar mal agrupado", "12.34,00"],
    ["duas vírgulas", "1,0,0"],
    ["notação científica", "1e3"],
    ["acima do limite", "1.000.000.000,00"],
    ["só a vírgula", ","],
  ])("recusa %s", (_label, text) => {
    expect(parseAmountToCents(text)).toBeNull();
  });
});

describe("formatCents", () => {
  it.each([
    [0, "R$ 0,00"],
    [1, "R$ 0,01"],
    [15050, "R$ 150,50"],
    [123456, "R$ 1.234,56"],
    [MAX_AMOUNT_CENTS, "R$ 999.999.999,99"],
    [-123456, "-R$ 1.234,56"],
  ])("formata %i", (cents, text) => {
    expect(formatCents(cents)).toBe(text);
  });

  it("recusa valor que não é inteiro", () => {
    expect(() => formatCents(10.5)).toThrow(RangeError);
  });

  it("ida e volta não altera o valor", () => {
    for (const cents of [1, 29, 110, 435, 100501, 819213, MAX_AMOUNT_CENTS]) {
      expect(parseAmountToCents(formatCents(cents))).toBe(cents);
    }
  });
});
