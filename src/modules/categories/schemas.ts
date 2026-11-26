import { z } from "zod";

export const categoryTypes = ["expense", "income"] as const;
export type CategoryType = (typeof categoryTypes)[number];

export const categoryTypeLabels: Record<CategoryType, string> = {
  expense: "Despesa",
  income: "Receita",
};

export const catalogNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Informe o nome." })
  .max(40, { error: "O nome pode ter no máximo 40 caracteres." });

export const categorySchema = z.object({
  name: catalogNameSchema,
  type: z.enum(categoryTypes),
});

export const renameCategorySchema = z.object({ name: catalogNameSchema });

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  is_active: boolean;
};
