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
