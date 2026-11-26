"use client";

import { House, List, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NEW_PATH = "/transactions/new";

// Só entram itens que existem. Os demais do menu do SDD chegam com as suas fases.
// No celular, Configurações fica no topo da tela, não na barra.
const items = [
  { href: "/dashboard", label: "Início", icon: House, mobile: true },
  { href: "/transactions", label: "Lançamentos", icon: List, mobile: true },
  { href: "/settings", label: "Configurações", icon: Settings, mobile: false },
] as const;

// Celular: barra inferior clara, ao alcance do polegar. Computador: coluna lateral na cor
// da marca, com o item ativo destacado (DESIGN.md, Navegação).
const linkClass = [
  "group flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium outline-none",
  "text-muted-foreground hover:text-foreground aria-[current=page]:text-primary",
  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
  "md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:text-sm",
  "md:text-brand-muted md:hover:text-brand-foreground md:focus-visible:ring-brand-active",
  "md:aria-[current=page]:bg-brand-secondary md:aria-[current=page]:text-brand-foreground",
].join(" ");

// Lançar é a ação principal do produto: botão cheio, no centro da barra e no topo da coluna.
const launchClass = [
  "mx-auto flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none",
  "focus-visible:ring-3 focus-visible:ring-ring/50 md:mx-0 md:focus-visible:ring-brand-active",
].join(" ");

function isCurrent(pathname: string, href: string): boolean {
  return pathname.startsWith(href) && pathname !== NEW_PATH;
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:static md:w-60 md:shrink-0 md:border-t-0 md:bg-brand md:px-3 md:py-6"
    >
      <p className="hidden px-3 pb-6 text-lg font-semibold tracking-tight text-brand-foreground md:block">
        Meu Advisor
      </p>
      <ul className="grid grid-cols-3 items-center md:flex md:flex-col md:items-stretch md:gap-1">
        <li className="order-2 md:order-first md:pb-4">
          <Link
            href={NEW_PATH}
            aria-current={pathname === NEW_PATH ? "page" : undefined}
            className={launchClass}
          >
            <Plus aria-hidden className="size-5" />
            Lançar
          </Link>
        </li>
        {items.map(({ href, label, icon: Icon, mobile }, index) => (
          <li
            key={href}
            className={`${index === 0 ? "order-1" : "order-3"} ${mobile ? "" : "hidden md:block"}`}
          >
            <Link
              href={href}
              aria-current={isCurrent(pathname, href) ? "page" : undefined}
              className={linkClass}
            >
              <Icon
                aria-hidden
                className="size-5 md:group-aria-[current=page]:text-brand-active"
              />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
