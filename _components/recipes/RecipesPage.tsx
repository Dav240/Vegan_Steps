"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";

import AdSlot from "@/_components/ads/AdSlot";
import NavigationMenu from "@/_components/NavigationMenu";
import AddCard from "@/_components/recipes/cards/AddCard";
import RecipeCard from "@/_components/recipes/cards/RecipeCard";
import RecipeFilterPanel, {
  type RecipeStatusFilter,
  type RecipeTagMode,
} from "@/_components/recipes/library/RecipeFilterPanel";
import RecipeLibraryToolbar, {
  type RecipeLibrarySort,
} from "@/_components/recipes/library/RecipeLibraryToolbar";
import type { EditableRecipeStatus, RecipeTag } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

const PAGE_SIZE = 9;
const DEFAULT_STATUS_FILTERS: RecipeStatusFilter[] = [
  "DRAFT",
  "PENDING",
  "REJECTED",
  "APPROVED",
];

type RecipeLibraryKind = "my" | "saved";

type LibraryRecipe = {
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

type LibraryResponse = {
  recipes: LibraryRecipe[];
  hasMore: boolean;
  total: number;
  error?: string;
};

export default function RecipesPage({
  library,
}: {
  library: RecipeLibraryKind;
}) {
  const router = useRouter();
  const { currentUser, isSessionLoading } = useSession();
  const [recipes, setRecipes] = useState<LibraryRecipe[]>([]);
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [settledSearch, setSettledSearch] = useState("");
  const [sort, setSort] = useState<RecipeLibrarySort>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>([]);
  const [tagMode, setTagMode] = useState<RecipeTagMode>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<RecipeStatusFilter[]>(
    DEFAULT_STATUS_FILTERS
  );
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const isMyRecipes = library === "my";
  const showStatusFilter = isMyRecipes;
  const title = isMyRecipes ? "My Recipes" : "Saved Recipes";
  const remainingRecipeCount = Math.max(0, total - recipes.length);
  const loadMoreCount = Math.min(PAGE_SIZE, remainingRecipeCount);
  const activeFilterCount =
    Number(minRating > 0 || maxRating < 5) +
    selectedTags.length +
    (showStatusFilter
      ? Number(selectedStatuses.length !== DEFAULT_STATUS_FILTERS.length)
      : 0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (currentUser.userType === "VISITOR" || !currentUser.id) {
      router.replace("/");
      return;
    }

    if (currentUser.userType === "MODERATOR") {
      router.replace("/moderator");
    }
  }, [currentUser.id, currentUser.userType, isSessionLoading, router]);

  useEffect(() => {
    if (isSessionLoading || !currentUser.id || currentUser.userType !== "CLIENT") return;

    const controller = new AbortController();
    const params = createLibraryParams({
      library,
      sort,
      search: settledSearch,
      minRating,
      maxRating,
      selectedTags,
      tagMode,
      selectedStatuses,
      offset: 0,
    });

    fetch(`/api/recipes/library?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(readLibraryResponse)
      .then((data) => {
        setRecipes(data.recipes);
        setSavedStates(
          Object.fromEntries(
            data.recipes.map((recipe) => [recipe.recipeId, recipe.initiallySaved])
          )
        );
        setHasMore(data.hasMore);
        setTotal(data.total);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
          setRecipes([]);
          setHasMore(false);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [
    currentUser.id,
    currentUser.userType,
    isSessionLoading,
    library,
    maxRating,
    minRating,
    selectedTags,
    selectedStatuses,
    settledSearch,
    sort,
    tagMode,
  ]);

  async function loadMore() {
    if (
      isSessionLoading ||
      !currentUser.id ||
      currentUser.userType !== "CLIENT" ||
      !hasMore ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);
    setError("");

    try {
      const params = createLibraryParams({
        library,
        sort,
        search: settledSearch,
        minRating,
        maxRating,
        selectedTags,
        tagMode,
        selectedStatuses,
        offset: recipes.length,
      });
      const response = await fetch(`/api/recipes/library?${params.toString()}`);
      const data = await readLibraryResponse(response);

      setRecipes((current) => [...current, ...data.recipes]);
      setSavedStates((current) => ({
        ...current,
        ...Object.fromEntries(
          data.recipes.map((recipe) => [recipe.recipeId, recipe.initiallySaved])
        ),
      }));
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load more recipes."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleSavedChange(recipeId: string, saved: boolean) {
    setSavedStates((current) => ({ ...current, [recipeId]: saved }));

    if (library === "saved" && !saved) {
      setRecipes((current) =>
        current.filter((recipe) => recipe.recipeId !== recipeId)
      );
      setTotal((current) => Math.max(0, current - 1));
    }
  }

  function handleDeleted(recipeId: string) {
    setRecipes((current) =>
      current.filter((recipe) => recipe.recipeId !== recipeId)
    );
    setSavedStates((current) => {
      const remaining = { ...current };
      delete remaining[recipeId];
      return remaining;
    });
    setTotal((current) => Math.max(0, current - 1));
  }

  function changeRatingRange(minimum: number, maximum: number) {
    setMinRating(minimum);
    setMaxRating(maximum);
  }

  function resetFilters() {
    setMinRating(0);
    setMaxRating(5);
    setSelectedTags([]);
    setTagMode("all");
    setSelectedStatuses(DEFAULT_STATUS_FILTERS);
  }

  if (isSessionLoading || currentUser.userType !== "CLIENT" || !currentUser.id) return null;

  return (
    <main className="flex min-h-screen bg-vegr-cream text-vegr-ink">
      <NavigationMenu />

      <div className="min-w-0 flex-1 px-5 py-9 md:px-8 xl:px-10">
        <header className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <div>
            <p className="text-sm font-bold uppercase text-vegr-green-dark">
              Recipe library
            </p>
            <h1 className="mt-1 font-indie-flower text-5xl font-bold text-vegr-ink md:text-6xl">
              {title}
            </h1>
          </div>

          <div className="space-y-2">
            {!isLoading && !error && (
              <p className="text-right text-sm font-semibold text-zinc-600">
                {total} recipe{total === 1 ? "" : "s"}
              </p>
            )}
            <AdSlot variant="compact" />
          </div>
        </header>

        <div className="mt-7">
          <RecipeLibraryToolbar
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
            filtersOpen={filtersOpen}
            onFiltersOpenChange={setFiltersOpen}
            activeFilterCount={activeFilterCount}
          />
          {filtersOpen && (
            <RecipeFilterPanel
              minRating={minRating}
              maxRating={maxRating}
              onRatingChange={changeRatingRange}
              selectedTags={selectedTags}
              onSelectedTagsChange={setSelectedTags}
              tagMode={tagMode}
              onTagModeChange={setTagMode}
              selectedStatuses={selectedStatuses}
              onSelectedStatusesChange={setSelectedStatuses}
              showStatusFilter={showStatusFilter}
              onReset={resetFilters}
            />
          )}
        </div>

        {error && (
          <p className="mt-6 text-sm font-semibold text-red-700">{error}</p>
        )}

        {isLoading ? (
          <RecipeLibraryLoading />
        ) : (
          <>
            {recipes.length === 0 && !isMyRecipes && !error && (
              <p className="mt-10 text-zinc-600">
                No saved recipes match your current search and filters.
              </p>
            )}
            {recipes.length === 0 && isMyRecipes && !error && (
              <p className="mt-10 text-zinc-600">
                No recipes match your current search and filters.
              </p>
            )}

            <div className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.recipeId}
                  {...recipe}
                  savedState={savedStates[recipe.recipeId]}
                  onSavedChange={handleSavedChange}
                  onDeleted={handleDeleted}
                  className="max-w-none"
                />
              ))}
              {isMyRecipes && <AddCard className="max-w-none" />}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  className="flex h-11 items-center gap-2 rounded-md border border-vegr-green bg-white px-5 text-sm font-bold text-vegr-green-dark transition-colors hover:bg-vegr-green-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-green disabled:cursor-wait disabled:opacity-60"
                >
                  <ArrowDown
                    className={isLoadingMore ? "size-4 animate-bounce" : "size-4"}
                  />
                  {isLoadingMore ? "Loading..." : `Load ${loadMoreCount} more`}
                </button>
              </div>
            )}

            <AdSlot className="mt-12" />
          </>
        )}
      </div>
    </main>
  );
}

function createLibraryParams({
  library,
  sort,
  search,
  minRating,
  maxRating,
  selectedTags,
  tagMode,
  selectedStatuses,
  offset,
}: {
  library: RecipeLibraryKind;
  sort: RecipeLibrarySort;
  search: string;
  minRating: number;
  maxRating: number;
  selectedTags: RecipeTag[];
  tagMode: RecipeTagMode;
  selectedStatuses: RecipeStatusFilter[];
  offset: number;
}) {
  const params = new URLSearchParams({
    library,
    sort,
    query: search,
    minRating: String(minRating),
    maxRating: String(maxRating),
    tags: selectedTags.join(","),
    tagMode,
    statuses: selectedStatuses.join(","),
    offset: String(offset),
    limit: String(PAGE_SIZE),
  });

  return params;
}

async function readLibraryResponse(response: Response): Promise<LibraryResponse> {
  const data = (await response.json()) as LibraryResponse;
  if (!response.ok) {
    throw new Error(data.error || "Could not load your recipes.");
  }
  return data;
}

function RecipeLibraryLoading() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <div
          key={index}
          className="min-h-80 animate-pulse overflow-hidden rounded-lg border border-vegr-berry-soft bg-white"
        >
          <div className="aspect-[4/3] bg-vegr-green-soft" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 rounded bg-vegr-berry-soft" />
            <div className="h-4 w-1/2 rounded bg-vegr-green-soft" />
          </div>
        </div>
      ))}
    </div>
  );
}
