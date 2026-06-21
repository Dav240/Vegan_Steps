"use client";

import { useEffect, useState } from "react";

import RecipeCard from "@/_components/recipes/RecipeCard";
import SeeMoreCard from "@/_components/recipes/SeeMoreCard";
import { useSession } from "@/lib/session";

type RecentRecipe = {
  recipeId: string;
  name: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: string[];
  rating: number;
  initiallySaved: boolean;
};

export default function MyRecipesProfile({ savedRecipeStates, onSavedChange }: {
  savedRecipeStates: Record<string, boolean>;
  onSavedChange: (recipeId: string, saved: boolean) => void;
}) {
  const { currentUser } = useSession();
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesError, setRecipesError] = useState("");

  useEffect(() => {
    if (!currentUser.id || currentUser.userType === "VISITOR") {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/recipes/myrecipes?userId=${encodeURIComponent(currentUser.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load your recipes.");
        }

        return data as {
          recipes: RecentRecipe[];
          hasMore: boolean;
        };
      })
      .then((data) => {
        setRecentRecipes(data.recipes);
        setHasMoreRecipes(data.hasMore);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setRecipesError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRecipesLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentUser.id, currentUser.userType]);

  return (
    <section className="w-full py-8">
      <h2 className="font-indie-flower text-5xl font-bold text-vegr-ink">
        My Recipes
      </h2>

      {recipesLoading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}
              className="min-h-72 animate-pulse rounded-lg border border-vegr-berry-soft bg-white"
            >
              <div className="aspect-[4/3] bg-vegr-green-soft" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-vegr-berry-soft" />
                <div className="h-4 w-1/2 rounded bg-vegr-green-soft" />
              </div>
            </div>
          ))}
        </div>
      ) : recipesError ? (
        <p className="mt-6 text-sm font-medium text-red-700">{recipesError}</p>
      ) : recentRecipes.length === 0 ? (
        <p className="mt-6 text-zinc-600">
          You have not written any recipes yet.
        </p>
      ) : (
        <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {recentRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.recipeId}
              {...recipe}
              savedState={savedRecipeStates[recipe.recipeId]}
              onSavedChange={onSavedChange}
            />
          ))}
          {hasMoreRecipes && <SeeMoreCard />}
        </div>
      )}
    </section>
  );
}
