// Telas públicas de autenticação: uma coluna estreita, uma tarefa por tela.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-10 pb-12">
      <header>
        <p className="text-lg font-semibold tracking-tight text-primary">
          Meu Advisor
        </p>
        <p className="text-sm text-muted-foreground">
          Seu dinheiro, sob controle.
        </p>
      </header>
      <main className="mt-10">{children}</main>
    </div>
  );
}
