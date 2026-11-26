import type { Metadata } from "next";

import {
  CatalogList,
  CatalogRow,
  EmptyCatalog,
} from "@/components/catalog/catalog-row";
import { RowActions } from "@/components/catalog/row-actions";
import { TextLink } from "@/components/form/text-link";
import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  deleteCategoryAction,
  toggleCategoryAction,
} from "@/modules/categories/actions";
import { CategoryForm } from "@/modules/categories/components/category-form";
import { listCategories } from "@/modules/categories/repository";
import {
  categoryTypeLabels,
  categoryTypes,
} from "@/modules/categories/schemas";

export const metadata: Metadata = { title: "Categorias — Meu Advisor" };

export default async function CategoriesPage() {
  await requireUser();
  const categories = await listCategories(await createClient());

  return (
    <>
      <TextLink href="/settings">Configurações</TextLink>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Categorias</h1>
      <div className="flex flex-col gap-4">
        {categoryTypes.map((type) => {
          const ofType = categories.filter((item) => item.type === type);

          return (
            <Panel key={type} className="max-w-md">
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {categoryTypeLabels[type]}
                </h2>
                {ofType.length === 0 && (
                  <EmptyCatalog>Nenhuma categoria ainda.</EmptyCatalog>
                )}
                <CatalogList>
                  {ofType.map((category) => (
                    <CatalogRow
                      key={category.id}
                      title={category.name}
                      isActive={category.is_active}
                    >
                      <CategoryForm category={category} />
                      <RowActions
                        id={category.id}
                        isActive={category.is_active}
                        toggleAction={toggleCategoryAction}
                        deleteAction={deleteCategoryAction}
                      />
                    </CatalogRow>
                  ))}
                </CatalogList>
                <CategoryForm type={type} />
              </section>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
