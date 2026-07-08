import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { recipeCardSelect, toRecipeCard } from "@/lib/recipe-card-data";

type SaveRecipeBody = {
  userId?: unknown;
  recipeId?: unknown;
};

async function getSaveRequest(request: Request) {
  const body = (await request.json()) as SaveRecipeBody;
  const recipeId = typeof body.recipeId === "string" ? body.recipeId : "";

  if (!recipeId) {
    return null;
  }

  return { recipeId };
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);

    if (auth.response) {
      return auth.response;
    }

    const userId = auth.user.id;

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
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      select: {
        recipe: {
          select: recipeCardSelect,
        },
      },
    });

    return NextResponse.json({
      recipes: savedRecipes
        .slice(0, 3)
        .map(({ recipe }) => toRecipeCard(recipe, true)),
      hasMore: savedRecipes.length > 3,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading your saved recipes." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "save-recipe",
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const auth = await requireUser(request);

    if (auth.response) {
      return auth.response;
    }

    const saveRequest = await getSaveRequest(request);

    if (!saveRequest) {
      return NextResponse.json(
        { error: "A recipe ID is required." },
        { status: 400 }
      );
    }

    const { recipeId } = saveRequest;
    const userId = auth.user.id;
    const [user, recipe] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true },
      }),
      prisma.recipe.findFirst({
        where: {
          id: recipeId,
          isDeleted: false,
          author: {
            isDeleted: false,
          },
          OR: [{ status: "APPROVED" }, { authorId: userId }],
        },
        select: { id: true },
      }),
    ]);

    if (!user || user.isDeleted || !recipe) {
      return NextResponse.json(
        { error: !user || user.isDeleted ? "User account not found." : "Recipe not found." },
        { status: 404 }
      );
    }

    await prisma.savedRecipe.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
      update: {},
      create: {
        userId,
        recipeId,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while saving this recipe." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "unsave-recipe",
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const auth = await requireUser(request);

    if (auth.response) {
      return auth.response;
    }

    const saveRequest = await getSaveRequest(request);

    if (!saveRequest) {
      return NextResponse.json(
        { error: "A recipe ID is required." },
        { status: 400 }
      );
    }

    await prisma.savedRecipe.deleteMany({
      where: {
        userId: auth.user.id,
        recipeId: saveRequest.recipeId,
      },
    });

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while removing this saved recipe." },
      { status: 500 }
    );
  }
}
