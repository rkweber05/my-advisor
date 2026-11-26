import { expect, type Page } from "@playwright/test";

import { adminClient } from "../helpers/supabase";

// Caixa de e-mail do Supabase local (Mailpit).
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailpitSearch = { messages: { ID: string }[] };
type MailpitMessage = { HTML: string };

async function searchMail(email: string): Promise<MailpitSearch> {
  const query = encodeURIComponent(`to:${email}`);
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
  return (await response.json()) as MailpitSearch;
}

export async function countEmailsTo(email: string): Promise<number> {
  return (await searchMail(email)).messages.length;
}

// Caminho do link do e-mail mais recente. O endereço do site é trocado pelo do teste.
export async function emailLinkFor(email: string): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(async () => (id = (await searchMail(email)).messages[0]?.ID), {
      timeout: 15_000,
    })
    .toBeDefined();

  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  const { HTML } = (await response.json()) as MailpitMessage;
  const href = /href="([^"]+)"/.exec(HTML)?.[1]?.replaceAll("&amp;", "&");
  if (!href) throw new Error("E-mail sem link.");

  const url = new URL(href);
  return url.pathname + url.search;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function auditEventsOf(userId: string): Promise<string[]> {
  const { data, error } = await adminClient()
    .from("audit_events")
    .select("event_type")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data.map((row) => row.event_type as string);
}

export async function profileOf(userId: string) {
  const { data, error } = await adminClient()
    .from("profiles")
    .select("name, timezone")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as { name: string; timezone: string };
}

export async function userExists(userId: string): Promise<boolean> {
  const { data } = await adminClient().auth.admin.getUserById(userId);
  return Boolean(data.user);
}

export async function accountDeletionCount(): Promise<number> {
  const { count, error } = await adminClient()
    .from("account_deletions")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

// ---------- Fase 2: dados fictícios criados direto no banco, para os testes irem ao ponto.

type Row = Record<string, unknown>;

async function seed(table: string, row: Row): Promise<string> {
  const { data, error } = await adminClient()
    .from(table)
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export function seedAccount(userId: string, name: string, initialCents = 0) {
  return seed("accounts", {
    user_id: userId,
    name,
    account_type: "checking",
    initial_balance_cents: initialCents,
  });
}

export function seedCard(userId: string, name: string) {
  return seed("cards", { user_id: userId, name, brand: "visa" });
}

export async function categoryIdOf(userId: string, name: string, type: string) {
  const { data, error } = await adminClient()
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .eq("type", type)
    .single();
  if (error) throw error;
  return data.id as string;
}

export function seedTransaction(userId: string, row: Row) {
  return seed("transactions", {
    user_id: userId,
    idempotency_key: crypto.randomUUID(),
    ...row,
  });
}

export async function transactionsOf(userId: string) {
  const { data, error } = await adminClient()
    .from("transactions")
    .select(
      "id, type, amount_cents, payment_method, account_id, card_id, status",
    )
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function auditEntitiesOf(userId: string) {
  const { data, error } = await adminClient()
    .from("audit_events")
    .select("event_type, entity_type, entity_id")
    .eq("user_id", userId)
    .like("event_type", "transaction_%")
    .order("created_at");
  if (error) throw error;
  return data;
}
