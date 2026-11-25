import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireUser } from "@/lib/auth/require-user";

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

// O redirect real do Next.js interrompe a execução lançando um erro; o falso faz o mesmo.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

beforeEach(() => {
  getUser.mockReset();
});

describe("requireUser", () => {
  it("devolve o usuário confirmado pelo serviço de autenticação", async () => {
    const user = { id: "00000000-0000-0000-0000-00000000000a" };
    getUser.mockResolvedValue({ data: { user }, error: null });

    await expect(requireUser()).resolves.toBe(user);
  });

  it("redireciona para o login quando não há sessão", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(requireUser()).rejects.toThrow(
      "redirect:/login?notice=session_ended",
    );
  });

  it("redireciona para o login quando o serviço recusa o token", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("token revogado"),
    });

    await expect(requireUser()).rejects.toThrow(
      "redirect:/login?notice=session_ended",
    );
  });
});
