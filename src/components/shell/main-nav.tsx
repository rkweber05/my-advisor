"use client";

import { House, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Só entram itens que existem. Os demais do menu do SDD chegam com as suas fases.
const items = [
  { href: "/dashboard", label: "Início", icon: House },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

// Barra inferior no celular, ao alcance do polegar; coluna lateral no computador.
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:static md:w-56 md:shrink-0 md:border-t-0 md:border-r md:px-3 md:py-6"
    >
      <p className="hidden px-3 pb-6 text-lg font-semibold tracking-tight text-primary md:block">
        Meu Advisor
      </p>
      <ul className="flex md:flex-col md:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const current = pathname.startsWith(href);

          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset aria-[current=page]:text-primary md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:text-sm md:aria-[current=page]:bg-primary/8"
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
