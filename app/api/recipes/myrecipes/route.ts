import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "A user ID is required." },
        { status: 400 }
      );
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        authorId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        tags: true,
        averageRating: true,
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
      recipes: recipes.slice(0, 3).map((recipe) => ({
        recipeId: recipe.id,
        name: recipe.name,
        imageUrl: recipe.imageUrl,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        tags: recipe.tags,
        rating: Number(recipe.averageRating),
        initiallySaved: recipe.savedBy.length > 0,
      })),
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
