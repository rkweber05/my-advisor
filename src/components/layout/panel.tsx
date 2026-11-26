import { cn } from "@/lib/utils";

// Superfície branca sobre o fundo da aplicação: cards, formulários e listas (DESIGN.md).
export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl bg-card p-5 shadow-card", className)}
      {...props}
    />
  );
}
