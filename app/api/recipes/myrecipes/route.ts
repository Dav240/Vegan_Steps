import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { recipeCardSelect, toRecipeCard } from "@/lib/recipe-card-data";

export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);

    if (auth.response) {
      return auth.response;
    }

    const userId = auth.user.id;

    const recipes = await prisma.recipe.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
      select: {
        ...recipeCardSelect,
        savedBy: {
          where: {
            userId,
          },
          take: 1,
          select: {
            userId: true,
          },
        },
      },
    });

    return NextResponse.json({
      recipes: recipes
        .slice(0, 3)
        .map((recipe) => toRecipeCard(recipe, recipe.savedBy.length > 0)),
      hasMore: recipes.length > 3,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading your recipes." },
      { status: 500 }
    );
  }
}
