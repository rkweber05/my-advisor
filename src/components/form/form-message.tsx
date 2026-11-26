import type { FormState } from "@/lib/forms/form-state";

const baseClass = "rounded-lg border px-3 py-2.5 text-sm font-medium";

// Erro geral e confirmação de sucesso de um formulário, anunciados ao leitor de tela.
export function FormMessage({ state }: { state: FormState }) {
  if (state.message) {
    return (
      <p
        role="alert"
        className={`${baseClass} border-danger/40 bg-danger-soft text-danger-strong`}
      >
        {state.message}
      </p>
    );
  }

  if (state.success) {
    return (
      <p
        role="status"
        className={`${baseClass} border-success/40 bg-success-soft text-foreground`}
      >
        {state.success}
      </p>
    );
  }

  return null;
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={`${baseClass} border-info/40 bg-info-soft text-foreground`}
    >
      {children}
    </p>
  );
}
