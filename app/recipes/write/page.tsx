import { notFound } from "next/navigation";

import RecipeWriter from "@/_components/recipes/writing/RecipeWriter";

export default async function WriteRecipePage({ searchParams }: {
  searchParams: Promise<{ recipeId?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedRecipeId = Array.isArray(params.recipeId) ? params.recipeId[0] : params.recipeId;
  const recipeId = requestedRecipeId?.trim();

  if (!recipeId) {
    notFound();
  }

  return <RecipeWriter recipeId={recipeId} />;
}
