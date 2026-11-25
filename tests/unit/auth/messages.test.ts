import { describe, expect, it } from "vitest";

import { authMessages, loginNoticeFor } from "@/modules/auth/messages";

describe("mensagens de autenticação", () => {
  it("a mensagem de login recusado não diz qual dos dois dados está errado", () => {
    expect(authMessages.invalid_credentials).toBe(
      "E-mail ou senha incorretos.",
    );
  });

  it("só mostra avisos conhecidos na tela de login", () => {
    expect(loginNoticeFor("session_ended")).toBe(
      "Sua sessão terminou. Entre de novo.",
    );
    expect(loginNoticeFor("<script>")).toBeUndefined();
    expect(loginNoticeFor("constructor")).toBeUndefined();
    expect(loginNoticeFor(["session_ended"])).toBeUndefined();
  });
});
