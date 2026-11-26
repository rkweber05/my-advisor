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

import { deleteCategory, insertCategory, updateCategory } from "./repository";
import { categorySchema, renameCategorySchema } from "./schemas";

const PATH = "/settings/categories";
const idSchema = z.uuid();

export async function createCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const values = { name: textFrom(formData, "name") };
  const parsed = categorySchema.safeParse({
    ...values,
    type: textFrom(formData, "type"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const { error } = await insertCategory(await createClient(), parsed.data);
  if (error) return { message: catalogErrorMessage(error), values };

  revalidatePath(PATH);
  return { success: "Categoria criada." };
}

export async function renameCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const values = { name: textFrom(formData, "name") };
  const id = idSchema.safeParse(textFrom(formData, "id"));
  const parsed = renameCategorySchema.safeParse(values);
  if (!id.success || !parsed.success) {
    return {
      fieldErrors: parsed.success ? {} : fieldErrorsFrom(parsed.error),
      values,
    };
  }

  const { error } = await updateCategory(
    await createClient(),
    id.data,
    parsed.data,
  );
  if (error) return { message: catalogErrorMessage(error), values };

  revalidatePath(PATH);
  return { success: "Categoria salva.", values: parsed.data };
}

export async function toggleCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = idSchema.safeParse(textFrom(formData, "id"));
  if (!id.success) return {};

  const { error } = await updateCategory(await createClient(), id.data, {
    is_active: textFrom(formData, "is_active") === "true",
  });
  if (error) return { message: catalogErrorMessage(error) };

  revalidatePath(PATH);
  return {};
}

export async function deleteCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = idSchema.safeParse(textFrom(formData, "id"));
  if (!id.success) return {};

  const { error } = await deleteCategory(await createClient(), id.data);
  if (error) return { message: catalogErrorMessage(error) };

  revalidatePath(PATH);
  return {};
}
