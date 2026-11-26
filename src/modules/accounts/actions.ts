"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { catalogErrorMessage } from "@/lib/forms/catalog";
import {
  fieldErrorsFrom,
  textFrom,
  type FormState,
} from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";

import { deleteAccount, insertAccount, updateAccount } from "./repository";
import { accountSchema } from "./schemas";

const PATH = "/settings/accounts";
const idSchema = z.uuid();

function valuesFrom(formData: FormData) {
  return {
    name: textFrom(formData, "name"),
    institution: textFrom(formData, "institution"),
    account_type: textFrom(formData, "account_type"),
    initial_balance_cents: textFrom(formData, "initial_balance_cents"),
  };
}

// Com `id` no formulário, altera a conta; sem ele, cria.
export async function saveAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const values = valuesFrom(formData);
  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();
  const id = idSchema.safeParse(textFrom(formData, "id"));
  const { error } = id.success
    ? await updateAccount(supabase, id.data, parsed.data)
    : await insertAccount(supabase, parsed.data);
  if (error) return { message: catalogErrorMessage(error), values };

  revalidatePath(PATH);
  return id.success
    ? { success: "Conta salva.", values }
    : { success: "Conta criada." };
}

export async function toggleAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = idSchema.safeParse(textFrom(formData, "id"));
  if (!id.success) return {};

  const { error } = await updateAccount(await createClient(), id.data, {
    is_active: textFrom(formData, "is_active") === "true",
  });
  if (error) return { message: catalogErrorMessage(error) };

  revalidatePath(PATH);
  return {};
}

export async function deleteAccountRecordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = idSchema.safeParse(textFrom(formData, "id"));
  if (!id.success) return {};

  const { error } = await deleteAccount(await createClient(), id.data);
  if (error) return { message: catalogErrorMessage(error) };

  revalidatePath(PATH);
  return {};
}
