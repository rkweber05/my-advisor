import type { z } from "zod";

// Resultado tipado que as Server Actions de formulário devolvem ao `useActionState`.
export type FormState = {
  // Erro geral, mostrado acima do formulário.
  message?: string;
  // Confirmação de que deu certo, quando a ação não redireciona.
  success?: string;
  fieldErrors?: Record<string, string>;
  // Valores devolvidos para o formulário não se esvaziar. Nunca inclui senha.
  values?: Record<string, string>;
};

export const emptyFormState: FormState = {};

// Uma mensagem por campo: a primeira que o schema apontar.
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    errors[field] ??= issue.message;
  }
  return errors;
}

export function textFrom(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
