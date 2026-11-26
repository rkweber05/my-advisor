export const transactionTypes = [
  "expense",
  "income",
  "transfer",
  "card_payment",
] as const;
export type TransactionType = (typeof transactionTypes)[number];

// Só estes tipos contam em indicadores de receita e despesa (regra 2). Transferência e
// pagamento de fatura nunca entram.
export const INDICATOR_TYPES = ["expense", "income"] as const;

export const typeLabels: Record<TransactionType, string> = {
  expense: "Despesa",
  income: "Receita",
  transfer: "Transferência",
  card_payment: "Fatura",
};

export const typeLongLabels: Record<TransactionType, string> = {
  expense: "Despesa",
  income: "Receita",
  transfer: "Transferência entre contas",
  card_payment: "Pagamento de fatura",
};

export const paymentMethods = [
  "pix",
  "debit_card",
  "credit_card",
  "cash",
  "bank_transfer",
  "boleto",
  "other",
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  debit_card: "Débito",
  credit_card: "Crédito",
  cash: "Dinheiro",
  bank_transfer: "Transferência",
  boleto: "Boleto",
  other: "Outro",
};

export const typeNotes: Partial<Record<TransactionType, string>> = {
  transfer: "Não conta como despesa nem como receita.",
  card_payment:
    "O pagamento da fatura não é uma nova despesa: as compras já foram lançadas.",
};
