import { MainNav } from "@/components/shell/main-nav";

// Casca da área logada. Não autoriza nada: cada página chama requireUser().
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <MainNav />
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <p className="px-5 pt-5 text-lg font-semibold tracking-tight text-primary md:hidden">
          Meu Advisor
        </p>
        <main className="flex w-full max-w-2xl flex-1 flex-col px-5 py-6 md:px-10 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
