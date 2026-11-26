// Telas públicas de autenticação: uma coluna estreita, uma tarefa por tela.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-10 pb-12">
      <header className="px-1">
        <p className="text-xl font-semibold tracking-tight text-brand">
          Meu Advisor
        </p>
        <p className="text-sm text-muted-foreground">
          Seu dinheiro, sob controle.
        </p>
      </header>
      <main className="mt-8 rounded-xl bg-card p-5 shadow-card">
        {children}
      </main>
    </div>
  );
}
