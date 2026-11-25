import type { Metadata } from "next";

import { redirectIfAuthenticated } from "@/lib/auth/require-user";
import { RegisterForm } from "@/modules/auth/components/register-form";

export const metadata: Metadata = { title: "Criar conta — Meu Advisor" };

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return <RegisterForm />;
}
