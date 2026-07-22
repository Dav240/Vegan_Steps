"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import AdSlot from "@/_components/ads/AdSlot";
import NavigationMenu from "@/_components/NavigationMenu";
import { type ExploreRecipe, type RecommendationRowData } from "@/_components/recipes/explore/RecommendationRow";
import RecipeFilterPanel, { type RecipeStatusFilter, type RecipeTagMode } from "@/_components/recipes/library/RecipeFilterPanel";
import RecipeLibraryToolbar, { type RecipeLibrarySort } from "@/_components/recipes/library/RecipeLibraryToolbar";
import ExploreBanner from "@/_components/recipes/explore/ExploreBanner";
import ExploreHeader from "@/_components/recipes/explore/ExploreHeader";
import ExploreSearchResults from "@/_components/recipes/explore/ExploreSearchResults";
import ExploreRecommendations from "@/_components/recipes/explore/ExploreRecommendations";

import type { RecipeTag } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

export const PAGE_SIZE = 10;
const EMPTY_STATUS_FILTERS: RecipeStatusFilter[] = [];

type ExploreVariant = "page" | "visitor";

type RecommendationResponse = {
  rows: RecommendationRowData[];
  error?: string;
};

type SearchResponse = {
  recipes: ExploreRecipe[];
  hasMore: boolean;
  total: number;
  error?: string;
};

export default function ExplorePage({
  variant = "page",
} : {
  variant?: ExploreVariant;
}) {
  const router = useRouter();
  const { currentUser, isSessionLoading } = useSession();
  const [search, setSearch] = useState("");
  const [settledSearch, setSettledSearch] = useState("");
  const [sort, setSort] = useState<RecipeLibrarySort>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>([]);
  const [tagMode, setTagMode] = useState<RecipeTagMode>("all");
  const [rows, setRows] = useState<RecommendationRowData[]>([]);
  const [searchRecipes, setSearchRecipes] = useState<ExploreRecipe[]>([]);
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const hasMounted = useHasMounted();

  const isVisitorVariant = variant === "visitor";
  const isLoggedInClient = Boolean(currentUser.id) && currentUser.userType === "CLIENT";
  const isSearchMode =
    settledSearch.length > 0 ||
    sort !== "recent" ||
    minRating > 0 ||
    maxRating < 5 ||
    selectedTags.length > 0;
  const activeFilterCount = Number(minRating > 0 || maxRating < 5) + selectedTags.length;
  const remainingRecipeCount = Math.max(0, total - searchRecipes.length);
  const loadMoreCount = Math.min(PAGE_SIZE, remainingRecipeCount);
  const actionsMode = isLoggedInClient && !isVisitorVariant ? "full" : "readonly";

  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!isVisitorVariant && currentUser.userType === "VISITOR") {
      router.replace("/");
      return;
    }

    if (!isVisitorVariant && currentUser.userType === "MODERATOR") {
      router.replace("/moderator");
    }
  }, [currentUser.userType, isSessionLoading, isVisitorVariant, router]);

  useEffect(() => {
    const controller = new AbortController();
    const params = createExploreParams({
      mode: "recommendations",
      userId: "",
    });

    fetch(`/api/recipes/explore?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(readRecommendationResponse)
      .then((data) => {
        setRows(data.rows);
        setSavedStates((current) => ({
          ...current,
          ...Object.fromEntries(
            data.rows.flatMap((row) =>
              row.recipes.map((recipe) => [
                recipe.recipeId,
                recipe.initiallySaved,
              ])
            )
          ),
        }));
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
          setRows([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingRecommendations(false);
        }
      });

    return () => controller.abort();
  }, [isLoggedInClient]);

  useEffect(() => {
    if (!isSearchMode) {
      return;
    }

    const controller = new AbortController();
    const params = createExploreParams({
      mode: "search",
      userId: "",
      search: settledSearch,
      sort,
      minRating,
      maxRating,
      selectedTags,
      tagMode,
      offset: 0,
    });

    fetch(`/api/recipes/explore?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(readSearchResponse)
      .then((data) => {
        setSearchRecipes(data.recipes);
        setSavedStates((current) => ({
          ...current,
          ...Object.fromEntries(
            data.recipes.map((recipe) => [
              recipe.recipeId,
              recipe.initiallySaved,
            ])
          ),
        }));
        setHasMore(data.hasMore);
        setTotal(data.total);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
          setSearchRecipes([]);
          setHasMore(false);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSearch(false);
        }
      });

    return () => controller.abort();
  }, [
    isLoggedInClient,
    isSearchMode,
    maxRating,
    minRating,
    selectedTags,
    settledSearch,
    sort,
    tagMode,
  ]);

  async function loadMore() {
    if (!isSearchMode || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setError("");

    try {
      const params = createExploreParams({
        mode: "search",
        userId: "",
        search: settledSearch,
        sort,
        minRating,
        maxRating,
        selectedTags,
        tagMode,
        offset: searchRecipes.length,
      });
      const response = await fetch(`/api/recipes/explore?${params.toString()}`);
      const data = await readSearchResponse(response);

      setSearchRecipes((current) => [...current, ...data.recipes]);
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
    setSort("recent");
    setSearch("");
    setSettledSearch("");
  }

  const content = (
    <div className={isVisitorVariant ? "mx-auto w-full max-w-7xl px-5 py-16 md:px-8" : "min-w-0 flex-1"}>
      {!isVisitorVariant && <ExploreBanner />}
      <div
        className={ isVisitorVariant ? "" : "grid gap-8 px-5 py-9 md:px-8 xl:grid-cols-[minmax(0,1fr)_180px] xl:px-10 2xl:grid-cols-[minmax(0,1fr)_220px]" }
      >
        <div className="min-w-0">
          <ExploreHeader isVisitor={isVisitorVariant} />
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
                selectedStatuses={EMPTY_STATUS_FILTERS}
                onSelectedStatusesChange={() => undefined} showStatusFilter={false} onReset={resetFilters}
              />
            )}
          </div>

          {error && (
            <p className="mt-6 text-sm font-semibold text-red-700">{error}</p>
          )}

          {isSearchMode ? (
            <ExploreSearchResults 
              recipes={searchRecipes} 
              savedStates={savedStates} 
              actionsMode={actionsMode} 
              total={total}
              hasMore={hasMore}
              loadMoreCount={loadMoreCount}
              isLoading={isLoadingSearch}
              isLoadingMore={isLoadingMore}
              onSavedChange={handleSavedChange}
              onLoadMore={loadMore}
            />
          ) : (
            <ExploreRecommendations
              rows={rows}
              savedStates={savedStates}
              actionsMode={actionsMode}
              isLoading={isLoadingRecommendations}
              onSavedChange={handleSavedChange}
            />
          )}
        </div>

        {!isVisitorVariant && (
          <div className="hidden xl:block">
            <AdSlot
              variant="rail"
              className="sticky top-8"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (isVisitorVariant) {
    return (
      <section id="explore" className="border-t-[10px] border-brand-gold bg-brand-cream text-brand-ink">
        {content}
        <div className="px-5 pb-12 md:px-8">
          <AdSlot className="mx-auto max-w-7xl" />
        </div>
      </section>
    );
  }

  if (!hasMounted) return null;

  if (isSessionLoading || currentUser.userType !== "CLIENT" || !currentUser.id) return null;

  return (
    <main className="flex min-h-screen bg-brand-cream text-brand-ink">
      <NavigationMenu />
      {content}
    </main>
  );
}

function createExploreParams({
  mode,
  userId = "",
  search = "",
  sort = "recent",
  minRating = 0,
  maxRating = 5,
  selectedTags = [],
  tagMode = "all",
  offset = 0,
}: {
  mode: "recommendations" | "search";
  userId?: string;
  search?: string;
  sort?: RecipeLibrarySort;
  minRating?: number;
  maxRating?: number;
  selectedTags?: RecipeTag[];
  tagMode?: RecipeTagMode;
  offset?: number;
}) {
  const params = new URLSearchParams({
    mode,
    userId,
    query: search,
    sort,
    minRating: String(minRating),
    maxRating: String(maxRating),
    tags: selectedTags.join(","),
    tagMode,
    offset: String(offset),
    limit: String(PAGE_SIZE),
  });

  return params;
}

async function readRecommendationResponse(
  response: Response
): Promise<RecommendationResponse> {
  const data = (await response.json()) as RecommendationResponse;
  if (!response.ok) {
    throw new Error(data.error || "Could not load Explore recommendations.");
  }
  return data;
}

async function readSearchResponse(response: Response): Promise<SearchResponse> {
  const data = (await response.json()) as SearchResponse;
  if (!response.ok) {
    throw new Error(data.error || "Could not load recipes.");
  }
  return data;
}

function useHasMounted() {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
}

function subscribeToHydration(onStoreChange: () => void) {
  window.queueMicrotask(onStoreChange);
  return () => undefined;
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}
