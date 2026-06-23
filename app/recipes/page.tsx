import { notFound } from "next/navigation";

import RecipeView from "@/_components/recipes/viewing/RecipeView";

export default async function RecipesPage({ searchParams }: {
  searchParams: Promise<{
    recipeId?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedRecipeId = Array.isArray(params.recipeId) ? params.recipeId[0] : params.recipeId;
  const recipeId = requestedRecipeId?.trim();

  if (!recipeId) {
    notFound();
  }

  return <RecipeView key={recipeId} recipeId={recipeId} />;
}
