"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { HOME_PATH, LOGIN_PATH, loginPathWithNotice } from "@/lib/auth/routes";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  fieldErrorsFrom,
  textFrom,
  type FormState,
} from "@/lib/forms/form-state";

import { authMessages, resetRequestedMessage } from "./messages";
import {
  changePasswordSchema,
  confirmLinkSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from "./schemas";
import {
  changePassword,
  confirmEmailLink,
  deleteAccount,
  requestPasswordReset,
  setPasswordAfterRecovery,
  signIn,
  signOut,
  signUp,
} from "./service";

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: textFrom(formData, "email") };
  const parsed = loginSchema.safeParse({
    ...values,
    password: textFrom(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const result = await signIn(parsed.data);
  if (!result.ok) {
    return { message: authMessages[result.reason], values };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    name: textFrom(formData, "name"),
    email: textFrom(formData, "email"),
  };
  const parsed = registerSchema.safeParse({
    ...values,
    password: textFrom(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const result = await signUp(parsed.data);
  if (!result.ok) {
    return { message: authMessages[result.reason], values };
  }

  return { success: parsed.data.email };
}

export async function forgotPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: textFrom(formData, "email") };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const result = await requestPasswordReset(parsed.data.email);
  if (!result.ok) {
    return { message: authMessages[result.reason], values };
  }

  return { success: resetRequestedMessage };
}

export async function confirmLinkAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = confirmLinkSchema.safeParse({
    token_hash: textFrom(formData, "token_hash"),
    type: textFrom(formData, "type"),
  });
  if (!parsed.success) {
    return { message: authMessages.link_invalid };
  }

  const result = await confirmEmailLink(parsed.data);
  if (!result.ok) {
    return { message: authMessages[result.reason] };
  }

  redirect(parsed.data.type === "recovery" ? "/update-password" : HOME_PATH);
}

export async function updatePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const parsed = updatePasswordSchema.safeParse({
    password: textFrom(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const result = await setPasswordAfterRecovery(parsed.data.password);
  if (!result.ok) {
    return { message: authMessages[result.reason] };
  }

  redirect(HOME_PATH);
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: textFrom(formData, "currentPassword"),
    password: textFrom(formData, "password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const result = await changePassword(user, parsed.data);
  if (!result.ok) {
    return { message: authMessages[result.reason] };
  }

  return {
    success: "Senha alterada. Os outros aparelhos foram desconectados.",
  };
}

export async function logoutAction(): Promise<void> {
  await requireUser();
  await signOut();
  redirect(LOGIN_PATH);
}

export async function deleteAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = deleteAccountSchema.safeParse({
    currentPassword: textFrom(formData, "currentPassword"),
    confirmation: textFrom(formData, "confirmation"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const result = await deleteAccount(user, parsed.data.currentPassword);
  if (!result.ok) {
    return { message: authMessages[result.reason] };
  }

  redirect(loginPathWithNotice("account_deleted"));
}
