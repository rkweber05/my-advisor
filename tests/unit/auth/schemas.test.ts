import { describe, expect, it } from "vitest";

import {
  confirmLinkSchema,
  deleteAccountSchema,
  loginSchema,
  registerSchema,
} from "@/modules/auth/schemas";
import { profileSchema } from "@/modules/profile/schemas";

const valid = {
  name: "Ana",
  email: "ana@example.test",
  password: "doze-caracteres",
};

describe("registerSchema", () => {
  it("normaliza e-mail e nome", () => {
    const result = registerSchema.parse({
      ...valid,
      name: "  Ana  ",
      email: "  Ana@Example.TEST ",
    });

    expect(result).toEqual(valid);
  });

  it("aceita senha de 12 caracteres sem regra de composição", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "aaaaaaaaaaaa" }).success,
    ).toBe(true);
  });

  it.each([
    ["senha de 11 caracteres", { password: "aaaaaaaaaaa" }],
    ["senha acima de 72 caracteres", { password: "a".repeat(73) }],
    ["e-mail inválido", { email: "ana@" }],
    ["nome só com espaços", { name: "   " }],
    ["nome acima de 80 caracteres", { name: "a".repeat(81) }],
  ])("recusa %s", (_label, change) => {
    expect(registerSchema.safeParse({ ...valid, ...change }).success).toBe(
      false,
    );
  });

  it("não corta espaços da senha", () => {
    const password = "  com espaços  ";

    expect(registerSchema.parse({ ...valid, password }).password).toBe(
      password,
    );
  });
});

describe("loginSchema", () => {
  it("não aplica a regra de comprimento à senha de quem já tem conta", () => {
    expect(
      loginSchema.safeParse({ email: valid.email, password: "curta" }).success,
    ).toBe(true);
  });
});

describe("confirmLinkSchema", () => {
  it("só aceita os tipos de link que o produto envia", () => {
    const base = { token_hash: "abc" };

    expect(
      confirmLinkSchema.safeParse({ ...base, type: "email" }).success,
    ).toBe(true);
    expect(
      confirmLinkSchema.safeParse({ ...base, type: "magiclink" }).success,
    ).toBe(false);
    expect(confirmLinkSchema.safeParse({ type: "email" }).success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("exige a palavra exata", () => {
    const base = { currentPassword: "qualquer" };

    expect(
      deleteAccountSchema.safeParse({ ...base, confirmation: "EXCLUIR" })
        .success,
    ).toBe(true);
    expect(
      deleteAccountSchema.safeParse({ ...base, confirmation: "excluir" })
        .success,
    ).toBe(false);
  });
});

describe("profileSchema", () => {
  it("aceita fuso IANA", () => {
    expect(
      profileSchema.safeParse({ name: "Ana", timezone: "America/Manaus" })
        .success,
    ).toBe(true);
  });

  it.each(["UTC+3", "Brasilia", ""])("recusa o fuso %s", (timezone) => {
    expect(profileSchema.safeParse({ name: "Ana", timezone }).success).toBe(
      false,
    );
  });
});
