import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "@/lib/security/csp";

function directive(csp: string, name: string): string {
  return csp.split("; ").find((d) => d.startsWith(name)) ?? "";
}

describe("buildContentSecurityPolicy", () => {
  it("em produção libera script só pelo nonce", () => {
    const scriptSrc = directive(
      buildContentSecurityPolicy("abc123", false),
      "script-src",
    );

    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("em produção não libera estilo inline", () => {
    const styleSrc = directive(
      buildContentSecurityPolicy("abc123", false),
      "style-src",
    );

    expect(styleSrc).toBe("style-src 'self' 'nonce-abc123'");
  });

  it("em desenvolvimento libera eval, exigido pelo Next.js", () => {
    const scriptSrc = directive(
      buildContentSecurityPolicy("abc123", true),
      "script-src",
    );

    expect(scriptSrc).toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("não libera conexão com outra origem", () => {
    const csp = buildContentSecurityPolicy("abc123", false);

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("connect-src");
    expect(csp).not.toContain("http");
  });
});
