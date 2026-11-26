import type { Metadata } from "next";

import { TextLink } from "@/components/form/text-link";
import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";
import { ChangePasswordForm } from "@/modules/auth/components/change-password-form";
import { LogoutForm } from "@/modules/auth/components/logout-form";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import { BRAZIL_TIMEZONES, otherTimezones } from "@/modules/profile/schemas";
import { getProfile } from "@/modules/profile/service";

export const metadata: Metadata = { title: "Configurações — Meu Advisor" };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="max-w-md">
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {children}
      </section>
    </Panel>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">
        Configurações
      </h1>
      <div className="flex flex-col gap-4">
        <Section title="Cadastros">
          <p className="text-sm text-muted-foreground">
            O que aparece para escolher na hora de lançar.
          </p>
          <ul className="flex flex-col">
            <li>
              <TextLink href="/settings/accounts">Contas</TextLink>
            </li>
            <li>
              <TextLink href="/settings/cards">Cartões</TextLink>
            </li>
            <li>
              <TextLink href="/settings/categories">Categorias</TextLink>
            </li>
          </ul>
        </Section>
        <Section title="Perfil">
          <p className="text-sm text-muted-foreground">
            E-mail da conta:{" "}
            <span className="font-medium break-all text-foreground">
              {user.email}
            </span>
          </p>
          <ProfileForm
            name={profile.name}
            timezone={profile.timezone}
            brazilTimezones={BRAZIL_TIMEZONES}
            otherTimezones={otherTimezones()}
          />
        </Section>
        <Section title="Senha">
          <ChangePasswordForm />
        </Section>
        <Section title="Sessão">
          <p className="text-sm text-muted-foreground">
            Sai de todos os aparelhos.
          </p>
          <LogoutForm />
        </Section>
        <Section title="Excluir conta">
          <p className="text-sm text-muted-foreground">
            Apaga a conta e todos os seus dados. Não tem volta.
          </p>
          <TextLink href="/settings/delete-account">
            Continuar para a exclusão
          </TextLink>
        </Section>
      </div>
    </>
  );
}
