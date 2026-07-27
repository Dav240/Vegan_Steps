"use client";

import { useEffect, useState } from "react";

import AddCard from "@/_components/recipes/cards/AddCard";
import AddSeeMoreCard from "@/_components/recipes/cards/AddSeeMoreCard";
import RecipeCard from "@/_components/recipes/cards/RecipeCard";
import { useSession } from "@/lib/session";

type RecentRecipe = {
  recipeId: string;
  authorId: string;
  name: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: string[];
  rating: number;
  initiallySaved: boolean;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";
};

export default function MyRecipesProfile({ refreshKey, savedRecipeStates, onSavedChange, onRecipeDeleted }: {
  refreshKey: number;
  savedRecipeStates: Record<string, boolean>;
  onSavedChange: (recipeId: string, saved: boolean) => void;
  onRecipeDeleted: () => void;
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

    fetch("/api/recipes/myrecipes", {
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
        setRecipesError("");
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
  }, [currentUser.id, currentUser.userType, refreshKey]);

  function handleDeleted(recipeId: string) {
    setRecentRecipes((current) =>
      current.filter((recipe) => recipe.recipeId !== recipeId)
    );
    onRecipeDeleted();
  }

  return (
    <section className="w-full py-8">
      <h2 className="font-indie-flower text-5xl font-bold text-brand-ink">
        My Recipes
      </h2>

      {recipesLoading ? (
        <div className="mt-8 grid max-w-[1576px] grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="min-h-[380px] w-full max-w-[370px] animate-pulse rounded-lg border border-brand-berry-soft bg-white">
              <div className="aspect-[4/3] bg-brand-green-soft" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-brand-berry-soft" />
                <div className="h-4 w-1/2 rounded bg-brand-green-soft" />
              </div>
            </div>
          ))}
        </div>
      ) : recipesError ? (
        <p className="mt-6 text-sm font-medium text-red-700">{recipesError}</p>
      ) : (
        <>
          {recentRecipes.length === 0 && (
            <p className="mt-6 text-zinc-600">
              You have not written any recipes yet.
            </p>
          )}
          <div className="mt-8 grid max-w-[1576px] grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentRecipes.map((recipe) => (
              <RecipeCard key={recipe.recipeId} 
                {...recipe} 
                savedState={savedRecipeStates[recipe.recipeId]}
                onSavedChange={onSavedChange}
                onDeleted={handleDeleted}
                wrapCompactTags
              />
            ))}
            {hasMoreRecipes ? <AddSeeMoreCard /> : <AddCard />}
          </div>
        </>
      )}
    </section>
  );
}
