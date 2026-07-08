"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";

import NavigationMenu from "@/_components/NavigationMenu";
import RecipeCard from "@/_components/recipes/cards/RecipeCard";
import RecommendationRow, {
  type ExploreRecipe,
  type RecommendationRowData,
} from "@/_components/recipes/explore/RecommendationRow";
import RecipeFilterPanel, {
  type RecipeStatusFilter,
  type RecipeTagMode,
} from "@/_components/recipes/library/RecipeFilterPanel";
import RecipeLibraryToolbar, {
  type RecipeLibrarySort,
} from "@/_components/recipes/library/RecipeLibraryToolbar";
import type { RecipeTag } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

const BANNER_URL = "https://res.cloudinary.com/diqefvh29/image/upload/banner_plbcgv";
const PAGE_SIZE = 10;
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
}: {
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
  const isLoggedInClient =
    Boolean(currentUser.id) && currentUser.userType === "CLIENT";
  const isSearchMode =
    settledSearch.length > 0 ||
    sort !== "recent" ||
    minRating > 0 ||
    maxRating < 5 ||
    selectedTags.length > 0;
  const activeFilterCount =
    Number(minRating > 0 || maxRating < 5) + selectedTags.length;
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
      <div className={isVisitorVariant ? "" : "px-5 py-9 md:px-8 xl:px-10"}>
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
              onSelectedStatusesChange={() => undefined}
              showStatusFilter={false}
              onReset={resetFilters}
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
    </div>
  );

  if (isVisitorVariant) {
    return (
      <section id="explore" className="border-t-[10px] border-vegr-gold bg-vegr-cream text-vegr-ink">
        {content}
      </section>
    );
  }

  if (!hasMounted) return null;

  if (isSessionLoading || currentUser.userType !== "CLIENT" || !currentUser.id) return null;

  return (
    <main className="flex min-h-screen bg-vegr-cream text-vegr-ink">
      <NavigationMenu />
      {content}
    </main>
  );
}

function ExploreBanner() {
  return (
    <section className="relative h-44 overflow-hidden border-b border-vegr-gold">
      <Image
        src={BANNER_URL}
        alt="Vegan food banner"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-vegr-berry-dark/50" />
      <div className="relative z-10 flex h-full items-center px-5 md:px-8 xl:px-10">
        <h1 className="font-indie-flower text-6xl font-bold text-white md:text-7xl">
          Explore
        </h1>
      </div>
    </section>
  );
}

function ExploreHeader({ isVisitor }: { isVisitor: boolean }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase text-vegr-green-dark">
          Recipe discovery
        </p>
        <h2 className="mt-1 text-4xl font-bold text-vegr-ink md:text-5xl">
          {isVisitor ? "Explore vegan recipes" : "Find your next vegan meal"}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-700">
          Search approved community recipes, or scroll through a few rows of
          recommendations picked from tags, ratings, views, and a little
          randomness.
        </p>
      </div>
    </header>
  );
}

function ExploreRecommendations({
  rows,
  savedStates,
  actionsMode,
  isLoading,
  onSavedChange,
}: {
  rows: RecommendationRowData[];
  savedStates: Record<string, boolean>;
  actionsMode: "full" | "readonly";
  isLoading: boolean;
  onSavedChange: (recipeId: string, saved: boolean) => void;
}) {
  if (isLoading) return <ExploreLoadingRows />;

  if (rows.length === 0) {
    return (
      <p className="mt-10 text-zinc-600">
        No approved recipes are ready for Explore yet.
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-16">
      {rows.map((row) => (
        <RecommendationRow
          key={row.id}
          row={row}
          savedStates={savedStates}
          actionsMode={actionsMode}
          onSavedChange={onSavedChange}
        />
      ))}
    </div>
  );
}

function ExploreSearchResults({
  recipes,
  savedStates,
  actionsMode,
  total,
  hasMore,
  loadMoreCount,
  isLoading,
  isLoadingMore,
  onSavedChange,
  onLoadMore,
}: {
  recipes: ExploreRecipe[];
  savedStates: Record<string, boolean>;
  actionsMode: "full" | "readonly";
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
        <div className="mt-5 grid grid-cols-1 items-stretch justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.recipeId}
              {...recipe}
              actionsMode={actionsMode}
              tagPresentation="explore"
              showOwnerStatus={false}
              savedState={savedStates[recipe.recipeId] ?? recipe.initiallySaved}
              onSavedChange={onSavedChange}
              className="min-h-[390px] max-w-[300px] md:min-h-0"
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
            className="flex h-11 items-center gap-2 rounded-md border border-vegr-green bg-white px-5 text-sm font-bold text-vegr-green-dark transition-colors hover:bg-vegr-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-green disabled:cursor-wait disabled:opacity-60"
          >
            <ArrowDown
              className={isLoadingMore ? "size-4 animate-bounce" : "size-4"}
            />
            {isLoadingMore ? "Loading..." : `Load ${loadMoreCount} more`}
          </button>
        </div>
      )}
    </>
  );
}

function ExploreLoadingRows() {
  return (
    <div className="mt-10 space-y-16">
      {Array.from({ length: 4 }, (_, rowIndex) => (
        <div key={rowIndex}>
          <div className="h-8 w-56 animate-pulse rounded bg-vegr-berry-soft" />
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
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
        </div>
      ))}
    </div>
  );
}

function ExploreGridLoading() {
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
