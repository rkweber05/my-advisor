"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import {
  fieldErrorsFrom,
  textFrom,
  type FormState,
} from "@/lib/forms/form-state";
import { authMessages } from "@/modules/auth/messages";

import { profileSchema } from "./schemas";
import { saveProfile } from "./service";

// Só nome e fuso saem do formulário. O dono do perfil é sempre o usuário da sessão.
export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const values = {
    name: textFrom(formData, "name"),
    timezone: textFrom(formData, "timezone"),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  if (!(await saveProfile(user.id, parsed.data))) {
    return { message: authMessages.unexpected, values };
  }

  revalidatePath("/settings");
  return { success: "Perfil salvo.", values: parsed.data };
}
