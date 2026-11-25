import "server-only";

import type { AuthError, User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createDisposableClient } from "@/lib/supabase/disposable";
import { createClient, type ServerClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/audit/service";

import type { AuthFailure } from "./messages";
import type {
  ChangePasswordInput,
  ConfirmLinkInput,
  LoginInput,
  RegisterInput,
} from "./schemas";

export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure };

const OK: AuthResult = { ok: true };
const HOOK_REJECTION = "signup_not_allowed";

function fail(reason: AuthFailure): AuthResult {
  return { ok: false, reason };
}

function failureFrom(error: AuthError): AuthFailure {
  if (error.status === 429) return "rate_limited";
  if (error.code === "invalid_credentials") return "invalid_credentials";
  if (error.code === "email_not_confirmed") return "email_not_confirmed";
  if (error.code === "same_password") return "same_password";
  return "unexpected";
}

export async function signIn(input: LoginInput): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) return fail(failureFrom(error));

  await recordAuditEvent(supabase, "login");
  return OK;
}

// E-mail fora da lista de autorizados é recusado pelo gancho do serviço de autenticação.
// Para quem chama, a resposta é a mesma de um cadastro aceito: não se revela quem está na lista.
export async function signUp(input: RegisterInput): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name } },
  });

  if (!error || error.message === HOOK_REJECTION) return OK;
  return fail(failureFrom(error));
}

// Encerra a sessão em todos os aparelhos (regra 7 da spec).
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await recordAuditEvent(supabase, "logout");
  await supabase.auth.signOut({ scope: "global" });
}

// Sempre "ok" para e-mail desconhecido: o serviço de autenticação não diferencia.
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error?.status === 429) return fail("rate_limited");
  return OK;
}

// Troca o token do link do e-mail por uma sessão. Só é chamada no clique do botão.
export async function confirmEmailLink(
  input: ConfirmLinkInput,
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp(input);

  if (error) return fail("link_invalid");

  await recordAuditEvent(supabase, "login");
  return OK;
}

const EMAIL_LINK_WINDOW_SECONDS = 60 * 60;

// O serviço de autenticação marca como "otp" a sessão aberta por link de e-mail. Só ela, e só
// na primeira hora, pode definir senha sem informar a atual.
async function sessionCameFromRecentEmailLink(supabase: ServerClient) {
  const { data } = await supabase.auth.getClaims();
  const methods: unknown = data?.claims.amr;
  const oldestAccepted = Date.now() / 1000 - EMAIL_LINK_WINDOW_SECONDS;

  return (
    Array.isArray(methods) &&
    methods.some(
      (entry) => entry?.method === "otp" && entry?.timestamp >= oldestAccepted,
    )
  );
}

async function setPassword(
  supabase: ServerClient,
  password: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(failureFrom(error));

  await recordAuditEvent(supabase, "password_changed");
  // A senha antiga pode ter vazado: as outras sessões caem.
  await supabase.auth.signOut({ scope: "others" });
  return OK;
}

// Nova senha sem a atual: só para sessão recém-aberta por um link de e-mail.
export async function setPasswordAfterRecovery(
  password: string,
): Promise<AuthResult> {
  const supabase = await createClient();
  if (!(await sessionCameFromRecentEmailLink(supabase))) {
    return fail("recovery_required");
  }

  return setPassword(supabase, password);
}

// Confere a senha em um cliente descartável, sem tocar nos cookies da sessão atual.
async function isCurrentPassword(email: string, password: string) {
  const disposable = createDisposableClient();
  const { error } = await disposable.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return false;

  await disposable.auth.signOut({ scope: "local" });
  return true;
}

export async function changePassword(
  user: User,
  input: ChangePasswordInput,
): Promise<AuthResult> {
  if (!user.email) return fail("unexpected");
  if (!(await isCurrentPassword(user.email, input.currentPassword))) {
    return fail("wrong_password");
  }

  return setPassword(await createClient(), input.password);
}

// Exclusão definitiva (D-14). O `cascade` do banco leva o perfil e os eventos de auditoria.
// Fica só uma linha em `account_deletions`, sem ligação com a pessoa.
export async function deleteAccount(
  user: User,
  currentPassword: string,
): Promise<AuthResult> {
  if (!user.email) return fail("unexpected");
  if (!(await isCurrentPassword(user.email, currentPassword))) {
    return fail("wrong_password");
  }

  const supabase = await createClient();
  await recordAuditEvent(supabase, "account_deletion_requested");
  await supabase.auth.signOut({ scope: "global" });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account_deletion_failed", error.code);
    return fail("unexpected");
  }

  const record = await admin.from("account_deletions").insert({});
  if (record.error) {
    console.error("account_deletion_record_failed", record.error.code);
  }
  return OK;
}
