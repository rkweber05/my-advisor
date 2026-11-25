import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
// Limite do algoritmo de hash usado pelo serviço de autenticação.
const PASSWORD_MAX_LENGTH = 72;
export const DELETE_CONFIRMATION_WORD = "EXCLUIR";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Informe um e-mail válido." }));

// Decisão D-33: só comprimento, sem regra de composição.
const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    error: `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  })
  .max(PASSWORD_MAX_LENGTH, {
    error: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  });

const currentPassword = z.string().min(1, { error: "Informe a senha." });

export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Informe seu nome." })
  .max(80, { error: "O nome pode ter no máximo 80 caracteres." });

export const loginSchema = z.object({ email, password: currentPassword });

export const registerSchema = z.object({
  name: nameSchema,
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const confirmLinkSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["email", "recovery"]),
});

export const updatePasswordSchema = z.object({ password: newPassword });

export const changePasswordSchema = z.object({
  currentPassword,
  password: newPassword,
});

export const deleteAccountSchema = z.object({
  currentPassword,
  confirmation: z.literal(DELETE_CONFIRMATION_WORD, {
    error: `Digite ${DELETE_CONFIRMATION_WORD} para confirmar.`,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ConfirmLinkInput = z.infer<typeof confirmLinkSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
