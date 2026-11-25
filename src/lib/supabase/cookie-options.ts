// Cookie de sessão fora do alcance do JavaScript da página (decisão D-32).
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;
