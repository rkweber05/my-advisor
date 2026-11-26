type CatalogRowProps = {
  title: string;
  detail?: string;
  value?: React.ReactNode;
  isActive: boolean;
  children: React.ReactNode;
};

// Linha de um cadastro: toca para abrir a edição. Item desativado fica esmaecido e marcado.
export function CatalogRow({
  title,
  detail,
  value,
  isActive,
  children,
}: CatalogRowProps) {
  return (
    <li className="border-b border-border last:border-b-0">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className={isActive ? "min-w-0" : "min-w-0 opacity-60"}>
            <span className="block truncate font-medium">{title}</span>
            {detail && (
              <span className="block truncate text-sm text-muted-foreground">
                {detail}
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {!isActive && (
              <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Desativado
              </span>
            )}
            {value}
            <span className="text-sm font-medium text-primary group-open:hidden">
              Editar
            </span>
            <span className="hidden text-sm font-medium text-primary group-open:inline">
              Fechar
            </span>
          </span>
        </summary>
        <div className="flex flex-col gap-5 pt-2 pb-5">{children}</div>
      </details>
    </li>
  );
}

export function CatalogList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>;
}

export function EmptyCatalog({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}
