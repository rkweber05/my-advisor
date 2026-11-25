import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LOCAL_HOSTS = ["127.0.0.1", "localhost"];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} ausente. Rode \`supabase start\` e confira o .env.local.`,
    );
  }
  return value;
}

// Os testes criam e apagam usuários: nunca podem rodar contra um projeto real.
function localSupabaseUrl(): string {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!LOCAL_HOSTS.includes(new URL(url).hostname)) {
    throw new Error("Os testes de integração só rodam no Supabase local.");
  }
  return url;
}

function newClient(key: string): SupabaseClient {
  return createClient(localSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(): SupabaseClient {
  return newClient(requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
}

export function adminClient(): SupabaseClient {
  return newClient(requiredEnv("SUPABASE_SECRET_KEY"));
}

export type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

const createdUserIds: string[] = [];

export function uniqueEmail(): string {
  return `${randomUUID()}@example.test`;
}

// Inclui um e-mail fictício na lista de autorizados a criar conta.
export async function allowEmail(email: string): Promise<void> {
  const { error } = await adminClient()
    .from("signup_allowlist")
    .insert({ email });
  if (error) throw error;
}

// Limpeza geral: apaga todo usuário e todo e-mail autorizado de teste, menos o do seed.
export async function deleteAllTestData(): Promise<void> {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  for (const user of data.users) {
    if (user.email?.endsWith("@example.test")) {
      await admin.auth.admin.deleteUser(user.id);
    }
  }
  await admin
    .from("signup_allowlist")
    .delete()
    .like("email", "%@example.test")
    .neq("email", "pessoa.autorizada@example.test");
}

// Cria um usuário fictício já confirmado e devolve um cliente autenticado como ele.
export async function createTestUser(name: string): Promise<TestUser> {
  const email = uniqueEmail();
  const password = randomUUID();

  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw error;
  createdUserIds.push(data.user.id);

  const client = anonClient();
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  return { id: data.user.id, email, password, client };
}

export async function deleteTestUser(id: string): Promise<void> {
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) throw error;
  createdUserIds.splice(createdUserIds.indexOf(id), 1);
}

export async function deleteTestUsers(): Promise<void> {
  for (const id of [...createdUserIds]) {
    await deleteTestUser(id);
  }
}
