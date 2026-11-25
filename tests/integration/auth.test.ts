import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  adminClient,
  allowEmail,
  anonClient,
  createTestUser,
  deleteAllTestData,
  type TestUser,
  uniqueEmail,
} from "../helpers/supabase";

const password = "senha-ficticia-de-teste";
let ana: TestUser;
let bia: TestUser;

beforeAll(async () => {
  ana = await createTestUser("Ana");
  bia = await createTestUser("Bia");
});

afterAll(deleteAllTestData);

describe("cadastro fechado (critério 3)", () => {
  it("o serviço de autenticação recusa e-mail fora da lista, chamado direto", async () => {
    const email = uniqueEmail();

    const { data, error } = await anonClient().auth.signUp({
      email,
      password,
      options: { data: { name: "Intrusa" } },
    });
    const { data: list } = await adminClient().auth.admin.listUsers({
      perPage: 1000,
    });

    expect(error?.status).toBe(403);
    expect(data.user).toBeNull();
    expect(list.users.some((user) => user.email === email)).toBe(false);
  });

  it("aceita e-mail da lista, mas só deixa entrar depois da confirmação", async () => {
    const email = uniqueEmail();
    await allowEmail(email);
    const client = anonClient();

    const signUp = await client.auth.signUp({
      email,
      password,
      options: { data: { name: "Convidada" } },
    });
    const signIn = await client.auth.signInWithPassword({ email, password });

    expect(signUp.error).toBeNull();
    expect(signUp.data.session).toBeNull();
    expect(signIn.error?.code).toBe("email_not_confirmed");
  });

  it("recusa senha com menos de 12 caracteres, chamado direto", async () => {
    const email = uniqueEmail();
    await allowEmail(email);

    const { error } = await anonClient().auth.signUp({
      email,
      password: "onze-letras",
      options: { data: { name: "Convidada" } },
    });

    expect(error?.code).toBe("weak_password");
  });

  it("usuária e visitante não leem nem alteram a lista de autorizados", async () => {
    const read = await ana.client.from("signup_allowlist").select("email");
    const write = await ana.client
      .from("signup_allowlist")
      .insert({ email: uniqueEmail() });
    const anon = await anonClient().from("signup_allowlist").select("email");

    expect(read.error?.code).toBe("42501");
    expect(write.error?.code).toBe("42501");
    expect(anon.error?.code).toBe("42501");
  });
});

describe("audit_events (critério 6)", () => {
  it("usuária grava e lê só os próprios eventos", async () => {
    await ana.client.from("audit_events").insert({ event_type: "login" });
    await bia.client.from("audit_events").insert({ event_type: "logout" });

    const { data } = await ana.client
      .from("audit_events")
      .select("user_id, event_type");

    expect(data).toEqual([{ user_id: ana.id, event_type: "login" }]);
  });

  it("usuária não grava evento em nome de outra conta", async () => {
    const { error } = await ana.client
      .from("audit_events")
      .insert({ user_id: bia.id, event_type: "login" });

    expect(error?.code).toBe("42501");
  });

  it("evento gravado não é alterado nem apagado", async () => {
    const update = await ana.client
      .from("audit_events")
      .update({ event_type: "logout" })
      .eq("user_id", ana.id);
    const remove = await ana.client
      .from("audit_events")
      .delete()
      .eq("user_id", ana.id);

    expect(update.error?.code).toBe("42501");
    expect(remove.error?.code).toBe("42501");
  });

  it("visitante anônimo não lê eventos (critério 7)", async () => {
    const { error } = await anonClient().from("audit_events").select("id");

    expect(error?.code).toBe("42501");
  });
});

describe("account_deletions", () => {
  it("usuária e visitante não leem nem gravam", async () => {
    const read = await ana.client.from("account_deletions").select("id");
    const write = await ana.client.from("account_deletions").insert({});
    const anon = await anonClient().from("account_deletions").select("id");

    expect(read.error?.code).toBe("42501");
    expect(write.error?.code).toBe("42501");
    expect(anon.error?.code).toBe("42501");
  });
});

describe("logout (critério 9)", () => {
  it("o serviço de autenticação recusa o token antigo depois do logout", async () => {
    const eva = await createTestUser("Eva");
    const { data } = await eva.client.auth.getSession();
    const oldToken = data.session?.access_token ?? "";

    const before = await anonClient().auth.getUser(oldToken);
    await eva.client.auth.signOut({ scope: "global" });
    const after = await anonClient().auth.getUser(oldToken);

    expect(before.data.user?.id).toBe(eva.id);
    expect(after.data.user).toBeNull();
    expect(after.error).not.toBeNull();
  });
});
