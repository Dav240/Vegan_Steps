"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import RecipeCard from "@/_components/recipes/cards/RecipeCard";
import type { EditableRecipeStatus } from "@/lib/recipe-draft";

export type ExploreRecipe = {
  recipeId: string;
  authorId: string;
  name: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: string[];
  rating: number;
  status: EditableRecipeStatus;
  initiallySaved: boolean;
};

export type RecommendationRowData = {
  id: string;
  title: string;
  subtitle: string;
  recipes: ExploreRecipe[];
};

export default function RecommendationRow({
  row,
  savedStates,
  actionsMode,
  onSavedChange,
}: {
  row: RecommendationRowData;
  savedStates: Record<string, boolean>;
  actionsMode: "full" | "readonly";
  onSavedChange: (recipeId: string, saved: boolean) => void;
}) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = useVisibleRecipeCount();
  const canSlide = row.recipes.length > visibleCount;

  const visibleRecipes = useMemo(() => {
    if (row.recipes.length <= visibleCount) return row.recipes;

    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (startIndex + offset) % row.recipes.length;
      return row.recipes[index];
    });
  }, [row.recipes, startIndex, visibleCount]);

  function slide(direction: -1 | 1) {
    if (!canSlide) return;
    setStartIndex(
      (current) => (current + direction + row.recipes.length) % row.recipes.length
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-brand-ink md:text-3xl">
        {row.title}
      </h2>

      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 md:hidden">
        {row.recipes.map((recipe) => (
          <div
            key={`${row.id}-mobile-${recipe.recipeId}`}
            className="min-w-[78%] max-w-[280px] snap-center"
          >
            <RecipeCard
              {...recipe}
              actionsMode={actionsMode}
              tagPresentation="explore"
              showOwnerStatus={false}
              savedState={savedStates[recipe.recipeId] ?? recipe.initiallySaved}
              onSavedChange={onSavedChange}
              className="min-h-[390px] max-w-none"
            />
          </div>
        ))}
      </div>

      <div className="hidden items-center gap-4 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto]">
        {canSlide ? (
          <CarouselButton
            direction="left"
            onClick={() => slide(-1)}
            label={`Previous ${row.title} recipe`}
          />
        ) : (
          <span className="hidden size-11 md:block" aria-hidden="true" />
        )}

        <div
          className="grid min-w-0 gap-5 overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${visibleRecipes.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleRecipes.map((recipe) => (
            <RecipeCard
              key={`${row.id}-${recipe.recipeId}`}
              {...recipe}
              actionsMode={actionsMode}
              tagPresentation="explore"
              showOwnerStatus={false}
              savedState={savedStates[recipe.recipeId] ?? recipe.initiallySaved}
              onSavedChange={onSavedChange}
              className="h-full max-w-none"
            />
          ))}
        </div>

        {canSlide ? (
          <CarouselButton
            direction="right"
            onClick={() => slide(1)}
            label={`Next ${row.title} recipe`}
          />
        ) : (
          <span className="hidden size-11 md:block" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}

function CarouselButton({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-brand-berry bg-white text-brand-berry shadow-sm transition-colors hover:bg-brand-berry hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry"
    >
      <Icon className="size-6" />
    </button>
  );
}

function useVisibleRecipeCount() {
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    function updateVisibleCount() {
      if (window.matchMedia("(min-width: 1536px)").matches) {
        setVisibleCount(5);
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setVisibleCount(4);
      } else {
        setVisibleCount(1);
      }
    }

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  return visibleCount;
}
