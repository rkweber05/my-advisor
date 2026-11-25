import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/lib/auth/routes";

describe("isPublicPath", () => {
  it.each(["/", "/login", "/register", "/forgot-password", "/auth/confirm"])(
    "%s é pública",
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it.each([
    "/dashboard",
    "/settings",
    "/update-password",
    "/login/extra",
    "/rota-que-ainda-nao-existe",
  ])("%s exige sessão", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
