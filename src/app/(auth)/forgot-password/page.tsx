import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar a senha — Meu Advisor" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
