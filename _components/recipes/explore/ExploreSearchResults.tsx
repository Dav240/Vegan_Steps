import { ArrowDown } from "lucide-react";

import { type ExploreRecipe } from "@/_components/recipes/explore/RecommendationRow";
import ExploreGridLoading from "@/_components/recipes/explore/ExploreGridLoading";
import RecipeCard from "@/_components/recipes/cards/RecipeCard";

export default function ExploreSearchResults({
    recipes,
    savedStates,
    actionsMode,
    ratingPlacement = "side",
    total,
    hasMore,
    loadMoreCount,
    isLoading,
    isLoadingMore,
    onSavedChange,
    onLoadMore,
} : {
    recipes: ExploreRecipe[];
    savedStates: Record<string, boolean>;
    actionsMode: "full" | "readonly";
    ratingPlacement?: "side" | "below-title";
    total: number;
    hasMore: boolean;
    loadMoreCount: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    onSavedChange: (recipeId: string, saved: boolean) => void;
    onLoadMore: () => void;
}) {
    if (isLoading) return <ExploreGridLoading />;

    return (
    <>
        <div className="mt-8 flex justify-end">
        <p className="text-sm font-semibold text-zinc-600">
            {total} approved recipe{total === 1 ? "" : "s"}
        </p>
        </div>

        {recipes.length === 0 ? (
        <p className="mt-10 text-zinc-600">
            No approved recipes match your current search and filters.
        </p>
        ) : (
        <div className="mt-5 grid grid-cols-1 items-stretch justify-start gap-5 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(260px,300px))]">
            {recipes.map((recipe) => (
            <RecipeCard
                key={recipe.recipeId}
                {...recipe}
                actionsMode={actionsMode}
                tagPresentation="explore"
                ratingPlacement={ratingPlacement}
                showOwnerStatus={false}
                savedState={savedStates[recipe.recipeId] ?? recipe.initiallySaved}
                onSavedChange={onSavedChange}
                className="min-h-[390px] w-full max-w-[300px] md:min-h-0"
            />
            ))}
        </div>
        )}

        {hasMore && (
        <div className="mt-10 flex justify-center">
            <button
            type="button"
            onClick={() => void onLoadMore()}
            disabled={isLoadingMore}
            className="flex h-11 items-center gap-2 rounded-md border border-brand-green bg-white px-5 text-sm font-bold text-brand-green-dark transition-colors hover:bg-brand-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:cursor-wait disabled:opacity-60"
            >
                <ArrowDown className={isLoadingMore ? "size-4 animate-bounce" : "size-4"}/>
                {isLoadingMore ? "Loading..." : `Load ${loadMoreCount} more`}
            </button>
        </div>
        )}
    </>
    );
}
