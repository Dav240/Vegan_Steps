import { NextResponse } from "next/server";

import type { RecipeStatus, Tag } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { recipeCardSelect, toRecipeCard } from "@/lib/recipe-card-data";
import { RECIPE_TAGS } from "@/lib/recipe-draft";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const DEFAULT_STATUSES: RecipeStatus[] = [
  "DRAFT",
  "PENDING",
  "REJECTED",
  "APPROVED",
];

type LibraryKind = "my" | "saved";
type LibrarySort = "recent" | "popular" | "rated";
type TagMode = "all" | "partial";

type LibraryCandidate = {
  recipe: Parameters<typeof toRecipeCard>[0] & {
    updatedAt: Date;
    viewCount: number;
  };
  initiallySaved: boolean;
  recentAt: Date;
};

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("userId")?.trim();
    const library = parseLibraryKind(searchParams.get("library"));
    const sort = parseSort(searchParams.get("sort"));
    const tagMode = parseTagMode(searchParams.get("tagMode"));
    const query = searchParams.get("query")?.trim() ?? "";
    const minRating = parseRating(searchParams.get("minRating"), 0);
    const maxRating = parseRating(searchParams.get("maxRating"), 5);
    const offset = parseWholeNumber(searchParams.get("offset"), 0);
    const limit = Math.min(
      Math.max(parseWholeNumber(searchParams.get("limit"), DEFAULT_PAGE_SIZE), 1),
      MAX_PAGE_SIZE
    );
    const tags = parseTags(searchParams.get("tags"));
    const statuses = parseStatuses(searchParams.get("statuses"));

    if (!userId) {
      return NextResponse.json(
        { error: "A user ID is required." },
        { status: 400 }
      );
    }

    if (minRating > maxRating) {
      return NextResponse.json(
        { error: "The minimum rating cannot exceed the maximum rating." },
        { status: 400 }
      );
    }

    const candidates =
      library === "my"
        ? await getMyRecipeCandidates(userId)
        : await getSavedRecipeCandidates(userId);

    const matches = candidates
      .filter(({ recipe }) => sort === "recent" || recipe.status === "APPROVED")
      .filter(({ recipe }) => statuses.includes(recipe.status))
      .filter(({ recipe }) => matchesSearch(recipe.name, query))
      .filter(({ recipe }) => {
        const rating = Number(recipe.averageRating);
        return rating >= minRating && rating <= maxRating;
      })
      .filter(({ recipe }) => matchesTags(recipe.tags, tags, tagMode))
      .sort((left, right) => compareCandidates(left, right, sort));

    const page = matches.slice(offset, offset + limit);

    return NextResponse.json({
      recipes: page.map(({ recipe, initiallySaved }) =>
        toRecipeCard(recipe, initiallySaved)
      ),
      hasMore: offset + page.length < matches.length,
      total: matches.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading your recipe library." },
      { status: 500 }
    );
  }
}

async function getMyRecipeCandidates(userId: string): Promise<LibraryCandidate[]> {
  const recipes = await prisma.recipe.findMany({
    where: { authorId: userId, isDeleted: false },
    select: {
      ...recipeCardSelect,
      updatedAt: true,
      viewCount: true,
      savedBy: {
        where: { userId },
        take: 1,
        select: { userId: true },
      },
    },
  });

  return recipes.map((recipe) => ({
    recipe,
    initiallySaved: recipe.savedBy.length > 0,
    recentAt: recipe.updatedAt,
  }));
}

async function getSavedRecipeCandidates(
  userId: string
): Promise<LibraryCandidate[]> {
  const savedRecipes = await prisma.savedRecipe.findMany({
    where: {
      userId,
      recipe: {
        isDeleted: false,
        author: {
          isDeleted: false,
        },
      },
    },
    select: {
      createdAt: true,
      recipe: {
        select: {
          ...recipeCardSelect,
          updatedAt: true,
          viewCount: true,
        },
      },
    },
  });

  return savedRecipes.map(({ createdAt, recipe }) => ({
    recipe,
    initiallySaved: true,
    recentAt: createdAt,
  }));
}

function compareCandidates(
  left: LibraryCandidate,
  right: LibraryCandidate,
  sort: LibrarySort
) {
  if (sort === "popular") {
    return (
      right.recipe.viewCount - left.recipe.viewCount ||
      right.recentAt.getTime() - left.recentAt.getTime()
    );
  }

  if (sort === "rated") {
    return (
      Number(right.recipe.averageRating) - Number(left.recipe.averageRating) ||
      right.recipe.viewCount - left.recipe.viewCount ||
      right.recentAt.getTime() - left.recentAt.getTime()
    );
  }

  return right.recentAt.getTime() - left.recentAt.getTime();
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

function parseLibraryKind(value: string | null): LibraryKind {
  return value === "saved" ? "saved" : "my";
}

function parseSort(value: string | null): LibrarySort {
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

function parseStatuses(value: string | null): RecipeStatus[] {
  if (value === null) return DEFAULT_STATUSES;
  if (!value) return [];

  return value
    .split(",")
    .filter((status): status is RecipeStatus =>
      DEFAULT_STATUSES.includes(status as RecipeStatus)
    );
}

function parseRating(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(5, Math.max(0, parsed)) : fallback;
}

function parseWholeNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
