import { Settings } from "lucide-react";
import Link from "next/link";

import { MainNav } from "@/components/shell/main-nav";

// Casca da área logada. Não autoriza nada: cada página chama requireUser().
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <MainNav />
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="flex items-center justify-between bg-brand py-1.5 pr-1.5 pl-5 md:hidden">
          <p className="text-lg font-semibold tracking-tight text-brand-foreground">
            Meu Advisor
          </p>
          <Link
            href="/settings"
            aria-label="Configurações"
            className="flex size-11 items-center justify-center rounded-lg text-brand-muted outline-none hover:text-brand-foreground focus-visible:ring-3 focus-visible:ring-brand-active"
          >
            <Settings aria-hidden className="size-5" />
          </Link>
        </header>
        <main className="flex w-full max-w-2xl flex-1 flex-col px-4 py-6 md:px-10 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
