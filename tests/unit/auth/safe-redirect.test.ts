import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/auth/safe-redirect";

describe("safeRedirectPath", () => {
  it.each(["/settings", "/settings/delete-account", "/dashboard?mes=11"])(
    "aceita o caminho interno %s",
    (path) => {
      expect(safeRedirectPath(path)).toBe(path);
    },
  );

  it.each([
    ["outro site", "https://exemplo.test/roubo"],
    ["duas barras", "//exemplo.test"],
    ["barra invertida", "/\\exemplo.test"],
    ["barra invertida no meio", "/a\\b"],
    ["sem barra inicial", "settings"],
    ["esquema javascript", "javascript:alert(1)"],
    ["quebra de linha", "/a\nb"],
    ["vazio", ""],
    ["ausente", null],
    ["arquivo enviado", new File([], "x")],
  ])("troca %s pela página inicial", (_label, value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });
});
