"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays, Utensils } from "lucide-react";

import NavigationMenu from "@/_components/NavigationMenu";
import VisitorHeader from "@/_components/home/VisitorHeader";
import EditableStarsRating, {
  type RatingUpdate,
} from "@/_components/recipes/ui/EditableStarsRating";
import InstructionTable, {
  type RecipeInstruction,
} from "@/_components/recipes/ui/InstructionTable";
import SaveButton from "@/_components/recipes/ui/SaveButton";
import StarsRating from "@/_components/recipes/ui/StarsRating";
import TagBubble from "@/_components/recipes/ui/TagBubble";
import TimeBubble from "@/_components/recipes/ui/TimeBubble";
import { Button } from "@/_components/ui/button";
import { useSession } from "@/lib/session";

type RecipeViewData = {
  recipeId: string;
  name: string;
  description: string;
  servings: number;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: string[];
  averageRating: number;
  ratingCount: number;
  userRating: number;
  initiallySaved: boolean;
  authorUsername: string;
  ingredients: RecipeIngredient[];
  stepsPrep: RecipeInstruction[];
  stepsCook: RecipeInstruction[];
  updatedAt: string;
};

type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
};

export default function RecipeView({ recipeId }: { recipeId: string }) {
  const { currentUser } = useSession();
  const [recipe, setRecipe] = useState<RecipeViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isLoggedIn =
    Boolean(currentUser.id) && currentUser.userType !== "VISITOR";

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    params.set("recipeId", recipeId);
    if (currentUser.id) {
      params.set("userId", currentUser.id);
    }

    fetch(`/api/recipes/view?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load this recipe.");
        }

        return data.recipe as RecipeViewData;
      })
      .then((loadedRecipe) => {
        setRecipe(loadedRecipe);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentUser.id, recipeId]);

  function handleSavedChange(_recipeId: string, saved: boolean) {
    setRecipe((currentRecipe) =>
      currentRecipe
        ? { ...currentRecipe, initiallySaved: saved }
        : currentRecipe
    );
  }

  function handleRatingChange(update: RatingUpdate) {
    setRecipe((currentRecipe) =>
      currentRecipe
        ? {
            ...currentRecipe,
            averageRating: update.averageRating,
            ratingCount: update.ratingCount,
            userRating: update.userRating,
          }
        : currentRecipe
    );
  }

  return (
    <main className={isLoggedIn ? "flex min-h-screen bg-vegr-cream" : "min-h-screen bg-vegr-cream"}>
      {isLoggedIn && <NavigationMenu />}

      <div className="min-w-0 flex-1">
        {!isLoggedIn && <VisitorHeader redirectAfterAuth={null} />}

        {isLoading ? (
          <RecipeViewLoading />
        ) : error || !recipe ? (
          <div className="px-6 py-16 md:px-12 lg:px-16">
            <p className="font-medium text-red-700">
              {error || "Recipe not found."}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1500px] px-6 py-10 md:px-12 lg:px-16">
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:gap-16">
              <section className="min-w-0">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-sm font-semibold uppercase text-vegr-berry">
                      Recipe by {recipe.authorUsername}
                    </p>
                    <h1 className="mt-1 text-5xl font-bold text-vegr-ink md:text-6xl">
                      {recipe.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <TimeBubble
                      type="prep"
                      minutes={recipe.prepTimeMinutes}
                      className="h-10 border-vegr-berry-soft px-4 text-sm"
                    />
                    <TimeBubble
                      type="cook"
                      minutes={recipe.cookTimeMinutes}
                      className="h-10 border-vegr-berry-soft px-4 text-sm"
                    />
                  </div>
                </div>

                <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-vegr-berry-soft bg-vegr-green-soft">
                  {recipe.imageUrl ? (
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-vegr-green">
                      <Utensils className="size-20" aria-hidden="true" />
                      <span className="sr-only">No recipe image available</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 inline-flex flex-col items-start">
                  <span className="text-4xl font-bold text-vegr-ink">
                    {recipe.averageRating.toFixed(1)}
                  </span>
                  <StarsRating
                    rating={recipe.averageRating}
                    size="md"
                    className="mt-2"
                  />
                  <span className="mt-2 text-sm text-zinc-600">
                    {recipe.ratingCount} total rating
                    {recipe.ratingCount === 1 ? "" : "s"}
                  </span>
                </div>
              </section>

              <section className="min-w-0 pt-1">
                <div className="flex items-center justify-end gap-2 text-sm text-zinc-600">
                  <CalendarDays className="size-4 text-vegr-berry" />
                  <span>Updated {formatDate(recipe.updatedAt)}</span>
                </div>

                <div className="mt-10">
                  <h2 className="font-indie-flower text-4xl font-bold text-vegr-ink">
                    Description
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
                    {recipe.description || "No description has been added yet."}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <TagBubble
                      key={tag}
                      tag={tag}
                      className="px-3 py-1.5 text-sm"
                    />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <SaveButton
                    recipeId={recipe.recipeId}
                    recipeName={recipe.name}
                    initiallySaved={recipe.initiallySaved}
                    savedState={recipe.initiallySaved}
                    onSavedChange={handleSavedChange}
                    className="size-12 border border-vegr-berry-soft bg-white shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-vegr-berry bg-white px-6 text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark"
                  >
                    Edit Your Own
                  </Button>
                </div>

                <div className="mt-9">
                  <h2 className="text-sm font-bold uppercase text-vegr-berry-dark">
                    {isLoggedIn ? "Your rating" : "Log in to rate"}
                  </h2>
                  <EditableStarsRating
                    key={`${recipe.recipeId}-${currentUser.id ?? "visitor"}-${recipe.userRating}`}
                    recipeId={recipe.recipeId}
                    initialRating={recipe.userRating}
                    onRatingChange={handleRatingChange}
                    className="mt-3"
                  />
                </div>

                <IngredientsTable
                  servings={recipe.servings}
                  ingredients={recipe.ingredients}
                />
              </section>
            </div>

            <div className="mt-20 grid items-start gap-8 lg:grid-cols-2">
              <InstructionTable type="prep" steps={recipe.stepsPrep} />
              <InstructionTable type="cook" steps={recipe.stepsCook} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function IngredientsTable({
  servings,
  ingredients,
}: {
  servings: number;
  ingredients: RecipeIngredient[];
}) {
  return (
    <section className="mt-16" aria-labelledby="ingredients-heading">
      <div className="overflow-hidden rounded-lg border border-vegr-berry-soft bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-vegr-green/20 bg-vegr-green-soft px-5 py-4">
          <h2
            id="ingredients-heading"
            className="font-indie-flower text-3xl font-bold text-vegr-ink"
          >
            Ingredients
          </h2>
          <span className="shrink-0 text-sm font-bold text-vegr-berry-dark">
            Servings: {servings}
          </span>
        </div>

        <table className="w-full border-collapse">
          <thead className="sr-only">
            <tr>
              <th scope="col">Amount</th>
              <th scope="col">Ingredient</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length > 0 ? (
              ingredients.map((ingredient) => (
                <tr
                  key={ingredient.id}
                  className="border-b border-vegr-green/15 last:border-b-0"
                >
                  <td className="w-32 px-5 py-3.5 align-top font-semibold text-vegr-green-dark">
                    {formatIngredientAmount(ingredient)}
                  </td>
                  <td className="px-5 py-3.5 text-vegr-ink">
                    {ingredient.name}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-sm text-zinc-600">
                  No ingredients have been added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecipeViewLoading() {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] animate-pulse gap-10 px-6 py-10 md:px-12 lg:grid-cols-2 lg:px-16">
      <div>
        <div className="h-14 w-2/3 rounded bg-vegr-berry-soft" />
        <div className="mt-6 aspect-[16/10] rounded-lg bg-vegr-green-soft" />
      </div>
      <div className="space-y-5 pt-16">
        <div className="h-9 w-1/3 rounded bg-vegr-berry-soft" />
        <div className="h-5 w-full rounded bg-vegr-green-soft" />
        <div className="h-5 w-4/5 rounded bg-vegr-green-soft" />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const unitLabels: Record<string, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITRE: "ml",
  LITRE: "l",
  TEASPOON: "tsp",
  TABLESPOON: "tbsp",
  CUP: "cup",
  PIECE: "piece",
  PINCH: "pinch",
  POUNDS: "lb",
  OUNCES: "oz",
  NONE: "",
};

function formatIngredientAmount(ingredient: RecipeIngredient) {
  const quantity =
    ingredient.quantity == null
      ? ""
      : new Intl.NumberFormat("en-GB", {
          maximumFractionDigits: 2,
        }).format(ingredient.quantity);
  const unit = ingredient.unit ? unitLabels[ingredient.unit] ?? ingredient.unit : "";

  return [quantity, unit].filter(Boolean).join(" ") || "To taste";
}
