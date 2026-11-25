import { describe, expect, it } from "vitest";

import { parseEnv } from "@/config/env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-publica-de-teste",
  SUPABASE_SECRET_KEY: "chave-secreta-de-teste",
};

describe("parseEnv", () => {
  it("devolve as variáveis quando todas são válidas", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("falha nomeando a variável ausente", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: obrigatória/);
  });

  it("falha quando a chave secreta está ausente", () => {
    expect(() =>
      parseEnv({ ...valid, SUPABASE_SECRET_KEY: undefined }),
    ).toThrowError(/SUPABASE_SECRET_KEY: obrigatória/);
  });

  it("falha quando a URL não é válida", () => {
    expect(() =>
      parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "não é uma url" }),
    ).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL: obrigatória e deve ser uma URL válida/,
    );
  });

  it("lista todos os problemas de uma vez e aponta o .env.example", () => {
    expect(() => parseEnv({})).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY[\s\S]*\.env\.example/,
    );
  });
});
