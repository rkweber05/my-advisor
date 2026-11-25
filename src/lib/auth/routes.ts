export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";

// Rotas abertas a visitantes. Qualquer outra exige sessão: rota nova nasce privada.
const PUBLIC_PATHS = [
  "/",
  LOGIN_PATH,
  "/register",
  "/forgot-password",
  "/auth/confirm",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export type LoginNotice = "session_ended" | "account_deleted";

export function loginPathWithNotice(notice: LoginNotice): string {
  return `${LOGIN_PATH}?notice=${notice}`;
}
