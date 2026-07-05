import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { recipeCardSelect, toRecipeCard } from "@/lib/recipe-card-data";

type SaveRecipeBody = {
  userId?: unknown;
  recipeId?: unknown;
};

async function getSaveRequest(request: Request) {
  const body = (await request.json()) as SaveRecipeBody;
  const userId = typeof body.userId === "string" ? body.userId : "";
  const recipeId = typeof body.recipeId === "string" ? body.recipeId : "";

  if (!userId || !recipeId) {
    return null;
  }

  return { userId, recipeId };
}

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "A user ID is required." },
        { status: 400 }
      );
    }

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
    const saveRequest = await getSaveRequest(request);

    if (!saveRequest) {
      return NextResponse.json(
        { error: "A user ID and recipe ID are required." },
        { status: 400 }
      );
    }

    const { userId, recipeId } = saveRequest;
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
    const saveRequest = await getSaveRequest(request);

    if (!saveRequest) {
      return NextResponse.json(
        { error: "A user ID and recipe ID are required." },
        { status: 400 }
      );
    }

    await prisma.savedRecipe.deleteMany({
      where: saveRequest,
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
