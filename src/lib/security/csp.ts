// CSP com nonce por requisição (decisão D-30, docs/SECURITY.md).
// Em desenvolvimento o Next.js precisa de `eval` e de estilo inline para as ferramentas de erro.
export function buildContentSecurityPolicy(
  nonce: string,
  isDev: boolean,
): string {
  const scriptSrc = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`;
  const styleSrc = `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`;

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
