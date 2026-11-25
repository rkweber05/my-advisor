import { redirect } from "next/navigation";

import { HOME_PATH } from "@/lib/auth/routes";

// A raiz não tem conteúdo próprio: quem não tem sessão é levado ao login pelo proxy.
export default function RootPage() {
  redirect(HOME_PATH);
}
