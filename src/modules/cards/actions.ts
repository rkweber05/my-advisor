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

import { deleteCard, insertCard, updateCard } from "./repository";
import { cardSchema } from "./schemas";

const PATH = "/settings/cards";
const idSchema = z.uuid();

function valuesFrom(formData: FormData) {
  return {
    name: textFrom(formData, "name"),
    institution: textFrom(formData, "institution"),
    brand: textFrom(formData, "brand"),
    credit_limit_cents: textFrom(formData, "credit_limit_cents"),
    closing_day: textFrom(formData, "closing_day"),
    due_day: textFrom(formData, "due_day"),
  };
}

// Com `id` no formulário, altera o cartão; sem ele, cria.
export async function saveCardAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const values = valuesFrom(formData);
  const parsed = cardSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();
  const id = idSchema.safeParse(textFrom(formData, "id"));
  const { error } = id.success
    ? await updateCard(supabase, id.data, parsed.data)
    : await insertCard(supabase, parsed.data);
  if (error) return { message: catalogErrorMessage(error), values };

  revalidatePath(PATH);
  return id.success
    ? { success: "Cartão salvo.", values }
    : { success: "Cartão criado." };
}

export async function toggleCardAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = idSchema.safeParse(textFrom(formData, "id"));
  if (!id.success) return {};

  const { error } = await updateCard(await createClient(), id.data, {
    is_active: textFrom(formData, "is_active") === "true",
  });
  if (error) return { message: catalogErrorMessage(error) };

  revalidatePath(PATH);
  return {};
}

export async function deleteCardAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = idSchema.safeParse(textFrom(formData, "id"));
  if (!id.success) return {};

  const { error } = await deleteCard(await createClient(), id.data);
  if (error) return { message: catalogErrorMessage(error) };

  revalidatePath(PATH);
  return {};
}
