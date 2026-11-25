import type { Metadata } from "next";

import { redirectIfAuthenticated } from "@/lib/auth/require-user";
import { LoginForm } from "@/modules/auth/components/login-form";
import { loginNoticeFor } from "@/modules/auth/messages";

export const metadata: Metadata = { title: "Entrar — Meu Advisor" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  await redirectIfAuthenticated();
  const { next, notice } = await searchParams;

  return (
    <LoginForm
      next={typeof next === "string" ? next : undefined}
      notice={loginNoticeFor(notice)}
    />
  );
}
