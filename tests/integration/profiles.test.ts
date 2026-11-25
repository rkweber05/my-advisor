import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  anonClient,
  createTestUser,
  deleteTestUser,
  deleteTestUsers,
  type TestUser,
} from "../helpers/supabase";

let ana: TestUser;
let bia: TestUser;

beforeAll(async () => {
  ana = await createTestUser("Ana");
  bia = await createTestUser("Bia");
});

afterAll(deleteTestUsers);

describe("profiles", () => {
  it("conta nova já tem perfil com BRL e America/Sao_Paulo (critério 5)", async () => {
    const { data, error } = await ana.client
      .from("profiles")
      .select("id, name, currency, timezone");

    expect(error).toBeNull();
    expect(data).toEqual([
      {
        id: ana.id,
        name: "Ana",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
      },
    ]);
  });

  it("usuária não lê o perfil de outra conta (critério 6)", async () => {
    const { data, error } = await ana.client
      .from("profiles")
      .select("id")
      .eq("id", bia.id);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("usuária não altera o perfil de outra conta (critério 6)", async () => {
    const attempt = await ana.client
      .from("profiles")
      .update({ name: "Invadida" })
      .eq("id", bia.id)
      .select("id");
    const { data } = await bia.client.from("profiles").select("name").single();

    expect(attempt.data).toEqual([]);
    expect(data).toEqual({ name: "Bia" });
  });

  it("usuária altera o próprio nome e fuso", async () => {
    const { data, error } = await bia.client
      .from("profiles")
      .update({ name: "Bia Lima", timezone: "America/Manaus" })
      .eq("id", bia.id)
      .select("name, timezone")
      .single();

    expect(error).toBeNull();
    expect(data).toEqual({ name: "Bia Lima", timezone: "America/Manaus" });
  });

  it.each([
    ["o id", { id: "00000000-0000-0000-0000-000000000001" }],
    ["a moeda", { currency: "USD" }],
    ["a data de criação", { created_at: "2000-01-01T00:00:00Z" }],
  ])("usuária não altera %s do próprio perfil", async (_label, change) => {
    const { error } = await ana.client
      .from("profiles")
      .update(change)
      .eq("id", ana.id);

    expect(error?.code).toBe("42501");
  });

  it("usuária não insere nem apaga perfil", async () => {
    const insert = await ana.client
      .from("profiles")
      .insert({ id: "00000000-0000-0000-0000-000000000001", name: "Falsa" });
    const remove = await ana.client.from("profiles").delete().eq("id", ana.id);

    expect(insert.error?.code).toBe("42501");
    expect(remove.error?.code).toBe("42501");
  });

  it("visitante anônimo não lê nenhum perfil (critério 7)", async () => {
    const { data, error } = await anonClient().from("profiles").select("id");

    expect(error?.code).toBe("42501");
    expect(data).toBeNull();
  });

  it("token de um usuário excluído deixa de ler o perfil", async () => {
    const eva = await createTestUser("Eva");
    await deleteTestUser(eva.id);

    const { data } = await eva.client.from("profiles").select("id");

    expect(data ?? []).toEqual([]);
  });
});
