import { NextResponse } from "next/server";

import type { Tag } from "@/app/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { recipeCardSelect, toRecipeCard } from "@/lib/recipe-card-data";
import { RECIPE_TAGS } from "@/lib/recipe-draft";
import {
  getRecipeTagLabel,
  RECIPE_TAG_CATEGORIES,
  type RecipeTagCategoryId,
} from "@/lib/recipe-tags";

const SEARCH_PAGE_SIZE = 10;
const MAX_SEARCH_PAGE_SIZE = 50;
const RECOMMENDATION_SIZE = 10;

type ExploreSort = "recent" | "popular" | "rated";
type TagMode = "all" | "partial";
type ExploreMode = "recommendations" | "search";

type ExploreRecipe = Parameters<typeof toRecipeCard>[0] & {
  updatedAt: Date;
  createdAt: Date;
  viewCount: number;
};

type ExploreCandidate = {
  recipe: ExploreRecipe;
  initiallySaved: boolean;
};

type RecommendationDefinition = {
  id: string;
  title: string;
  subtitle: string;
  tags?: Tag[];
  sort: ExploreSort;
  requireAllTags?: boolean;
};

export async function GET(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "explore",
      limit: 120,
      windowMs: 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const searchParams = new URL(request.url).searchParams;
    const mode = parseMode(searchParams.get("mode"));
    const currentUser = await getCurrentUser(request);
    const userId = currentUser?.userType === "CLIENT" ? currentUser.id : "";
    const sort = parseSort(searchParams.get("sort"));
    const tagMode = parseTagMode(searchParams.get("tagMode"));
    const query = searchParams.get("query")?.trim() ?? "";
    const minRating = parseRating(searchParams.get("minRating"), 0);
    const maxRating = parseRating(searchParams.get("maxRating"), 5);
    const offset = parseWholeNumber(searchParams.get("offset"), 0);
    const limit = Math.min(
      Math.max(parseWholeNumber(searchParams.get("limit"), SEARCH_PAGE_SIZE), 1),
      MAX_SEARCH_PAGE_SIZE
    );
    const tags = parseTags(searchParams.get("tags"));

    if (minRating > maxRating) {
      return NextResponse.json(
        { error: "The minimum rating cannot exceed the maximum rating." },
        { status: 400 }
      );
    }

    const candidates = await getApprovedCandidates(userId);

    if (mode === "search") {
      const matches = candidates
        .filter(({ recipe }) => matchesSearch(recipe.name, query))
        .filter(({ recipe }) => {
          const rating = Number(recipe.averageRating);
          return rating >= minRating && rating <= maxRating;
        })
        .filter(({ recipe }) => matchesTags(recipe.tags, tags, tagMode))
        .sort((left, right) => compareCandidates(left.recipe, right.recipe, sort));
      const page = matches.slice(offset, offset + limit);

      return NextResponse.json({
        recipes: page.map(({ recipe, initiallySaved }) =>
          toRecipeCard(recipe, initiallySaved)
        ),
        hasMore: offset + page.length < matches.length,
        total: matches.length,
      });
    }

    const recommendationRows = await buildRecommendationRows(userId, candidates);

    return NextResponse.json({ rows: recommendationRows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading Explore." },
      { status: 500 }
    );
  }
}

async function getApprovedCandidates(userId: string): Promise<ExploreCandidate[]> {
  const recipes = await prisma.recipe.findMany({
    where: {
      status: "APPROVED",
      isDeleted: false,
      author: {
        isDeleted: false,
      },
    },
    orderBy: [
      {
        viewCount: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    take: 240,
    select: {
      ...recipeCardSelect,
      updatedAt: true,
      createdAt: true,
      viewCount: true,
      savedBy: userId
        ? {
            where: {
              userId,
            },
            take: 1,
            select: {
              userId: true,
            },
          }
        : {
            take: 0,
            select: {
              userId: true,
            },
          },
    },
  });

  return recipes.map((recipe) => ({
    recipe,
    initiallySaved: recipe.savedBy.length > 0,
  }));
}

async function buildRecommendationRows(
  userId: string,
  candidates: ExploreCandidate[]
) {
  const definitions = await getRecommendationDefinitions(userId, candidates);
  const rows = definitions
    .map((definition) => {
      const pool = candidates
        .filter(({ recipe }) =>
          definition.tags
            ? definition.requireAllTags
              ? definition.tags.every((tag) => recipe.tags.includes(tag))
              : definition.tags.some((tag) => recipe.tags.includes(tag))
            : true
        )
        .sort((left, right) =>
          compareCandidates(left.recipe, right.recipe, definition.sort)
        );
      const recipes = chooseRandomized(pool, RECOMMENDATION_SIZE).map(
        ({ recipe, initiallySaved }) => toRecipeCard(recipe, initiallySaved)
      );

      return {
        id: definition.id,
        title: definition.title,
        subtitle: definition.subtitle,
        recipes,
      };
    })
    .filter((row) => row.recipes.length > 0);

  return rows.slice(0, 6);
}

async function getRecommendationDefinitions(
  userId: string,
  candidates: ExploreCandidate[]
): Promise<RecommendationDefinition[]> {
  const canPersonalize = userId
    ? await hasPersonalizedRecommendationConsent(userId)
    : false;
  const userTags = userId && canPersonalize ? await getUserTasteTagsSafely(userId) : [];
  const personalizedRows: RecommendationDefinition[] = userTags
    .slice(0, 2)
    .map((tag) => ({
      id: `for-you-${tag.toLowerCase()}`,
      title: `More ${formatRecommendationTitle(tag)}`,
      subtitle: "Based on recipes you have viewed, saved, or rated.",
      tags: [tag],
      sort: "rated",
    }));
  const weightedTagRows = getWeightedPopularTagDefinitions(candidates, 2);

  return [
    ...personalizedRows,
    {
      id: "popular",
      title: "Popular right now",
      subtitle: "Approved recipes other users are opening.",
      sort: "popular",
    },
    {
      id: "highest-rated",
      title: "Highly rated",
      subtitle: "Community favourites with strong ratings.",
      sort: "rated",
    },
    {
      id: "meal-prep",
      title: "Meal prep recipes",
      subtitle: "Cook once, eat well later.",
      tags: ["MEAL_PREP"],
      sort: "rated",
    },
    {
      id: "indian",
      title: "Indian cuisine",
      subtitle: "Spiced, comforting plant-based dishes.",
      tags: ["INDIAN"],
      sort: "rated",
    },
    ...weightedTagRows,
    {
      id: "breakfast",
      title: "Breakfast ideas",
      subtitle: "Start the day with something vegan.",
      tags: ["BREAKFAST"],
      sort: "rated",
    },
    {
      id: "new",
      title: "Freshly approved",
      subtitle: "New arrivals from the community.",
      sort: "recent",
    },
  ];
}

async function hasPersonalizedRecommendationConsent(userId: string) {
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ personalisedRecommendationsEnabled: boolean }>
    >(
      `SELECT "personalisedRecommendationsEnabled"
       FROM "User"
       WHERE id = $1 AND "isDeleted" = false
       LIMIT 1`,
      userId
    );

    return rows[0]?.personalisedRecommendationsEnabled === true;
  } catch (error) {
    console.error("Could not check Explore personalization preference.", error);
    return false;
  }
}

function getWeightedPopularTagDefinitions(
  candidates: ExploreCandidate[],
  limit: number
): RecommendationDefinition[] {
  const counts = new Map<Tag, number>();

  for (const { recipe } of candidates) {
    for (const tag of recipe.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const categoryWeights: Record<RecipeTagCategoryId, number> = {
    allergies: 0.7,
    taste: 1,
    meal_type: 1.1,
    cultural_background: 1.25,
  };
  const candidatesByCategory = RECIPE_TAG_CATEGORIES.flatMap((category) =>
    category.tags.map((tag) => ({
      tag,
      categoryId: category.id,
      count: counts.get(tag) ?? 0,
      weightedScore:
        (counts.get(tag) ?? 0) *
        categoryWeights[category.id] *
        (0.75 + Math.random() * 0.5),
    }))
  )
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.weightedScore - left.weightedScore);
  const chosen: RecommendationDefinition[] = [];
  const usedCategories = new Set<RecipeTagCategoryId>();

  for (const entry of candidatesByCategory) {
    if (usedCategories.has(entry.categoryId) && usedCategories.size < RECIPE_TAG_CATEGORIES.length) {
      continue;
    }

    chosen.push({
      id: `tag-${entry.tag.toLowerCase()}`,
      title: `More ${getRecipeTagLabel(entry.tag)} recipes`,
      subtitle: "A popular tag from the public recipe catalogue.",
      tags: [entry.tag],
      sort: Math.random() > 0.35 ? "rated" : "popular",
    });
    usedCategories.add(entry.categoryId);

    if (chosen.length >= limit) {
      return chosen;
    }
  }

  return candidatesByCategory
    .filter((entry) => !chosen.some((definition) => definition.tags?.[0] === entry.tag))
    .slice(0, limit - chosen.length)
    .reduce((definitions, entry) => {
      definitions.push({
        id: `tag-${entry.tag.toLowerCase()}`,
        title: `More ${getRecipeTagLabel(entry.tag)} recipes`,
        subtitle: "A popular tag from the public recipe catalogue.",
        tags: [entry.tag],
        sort: Math.random() > 0.35 ? "rated" : "popular",
      });

      return definitions;
    }, chosen);
}

async function getUserTasteTagsSafely(userId: string) {
  try {
    return await getUserTasteTags(userId);
  } catch (error) {
    console.error("Could not load personalized Explore signals.", error);
    return [];
  }
}

async function getUserTasteTags(userId: string): Promise<Tag[]> {
  const [views, savedRecipes, ratings] = await Promise.all([
    prisma.recipeView.findMany({
      where: {
        userId,
        recipe: {
          status: "APPROVED",
          isDeleted: false,
          authorId: {
            not: userId,
          },
        },
      },
      orderBy: {
        viewedAt: "desc",
      },
      take: 100,
      select: {
        recipe: {
          select: {
            tags: true,
          },
        },
      },
    }),
    prisma.savedRecipe.findMany({
      where: {
        userId,
        recipe: {
          status: "APPROVED",
          isDeleted: false,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        recipe: {
          select: {
            tags: true,
          },
        },
      },
    }),
    prisma.rating.findMany({
      where: {
        ownerId: userId,
        stars: {
          gte: 4,
        },
        recipe: {
          status: "APPROVED",
          isDeleted: false,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 30,
      select: {
        stars: true,
        recipe: {
          select: {
            tags: true,
          },
        },
      },
    }),
  ]);

  const scores = new Map<Tag, number>();
  for (const view of views) {
    addTagsToScores(scores, view.recipe.tags, 1);
  }
  for (const savedRecipe of savedRecipes) {
    addTagsToScores(scores, savedRecipe.recipe.tags, 5);
  }
  for (const rating of ratings) {
    addTagsToScores(scores, rating.recipe.tags, rating.stars);
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([tag]) => tag);
}

function addTagsToScores(
  scores: Map<Tag, number>,
  tags: readonly Tag[],
  value: number
) {
  for (const tag of tags) {
    scores.set(tag, (scores.get(tag) ?? 0) + value);
  }
}

function compareCandidates(
  left: ExploreRecipe,
  right: ExploreRecipe,
  sort: ExploreSort
) {
  if (sort === "popular") {
    return (
      right.viewCount - left.viewCount ||
      Number(right.averageRating) - Number(left.averageRating) ||
      right.updatedAt.getTime() - left.updatedAt.getTime()
    );
  }

  if (sort === "rated") {
    return (
      Number(right.averageRating) - Number(left.averageRating) ||
      right.viewCount - left.viewCount ||
      right.updatedAt.getTime() - left.updatedAt.getTime()
    );
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function chooseRandomized<T>(items: T[], limit: number) {
  const pool = items.slice(0, Math.max(limit * 3, limit));

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, limit);
}

function matchesSearch(name: string, query: string) {
  if (!query) return true;

  const queryWords = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const normalizedName = name.toLocaleLowerCase();

  if (queryWords.length === 1) {
    return normalizedName.includes(queryWords[0]);
  }

  const queryInitials = queryWords.map((word) => word[0]).join("");
  const nameInitials = normalizedName
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word[0])
    .join("");

  return nameInitials.startsWith(queryInitials);
}

function matchesTags(
  recipeTags: Tag[],
  selectedTags: Tag[],
  mode: TagMode
) {
  if (selectedTags.length === 0) return true;

  return mode === "all"
    ? selectedTags.every((tag) => recipeTags.includes(tag))
    : selectedTags.some((tag) => recipeTags.includes(tag));
}

function parseMode(value: string | null): ExploreMode {
  return value === "search" ? "search" : "recommendations";
}

function parseSort(value: string | null): ExploreSort {
  return value === "popular" || value === "rated" ? value : "recent";
}

function parseTagMode(value: string | null): TagMode {
  return value === "partial" ? "partial" : "all";
}

function parseTags(value: string | null): Tag[] {
  if (!value) return [];

  return value
    .split(",")
    .filter((tag): tag is Tag => RECIPE_TAGS.includes(tag as Tag));
}

function parseRating(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(5, Math.max(0, parsed)) : fallback;
}

function parseWholeNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function formatRecommendationTitle(tag: Tag) {
  return tag
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
