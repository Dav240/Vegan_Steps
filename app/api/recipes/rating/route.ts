import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RatingBody = {
  userId?: unknown;
  recipeId?: unknown;
  stars?: unknown;
};

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as RatingBody;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const recipeId = typeof body.recipeId === "string" ? body.recipeId : "";
    const stars = typeof body.stars === "number" ? body.stars : 0;

    if (!userId || !recipeId || !Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "A user, recipe, and rating from 1 to 5 are required." },
        { status: 400 }
      );
    }

    const [user, recipe] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true },
      }),
    ]);

    if (!user || !recipe) {
      return NextResponse.json(
        { error: !user ? "User account not found." : "Recipe not found." },
        { status: 404 }
      );
    }

    const ratingUpdate = await prisma.$transaction(async (transaction) => {
      await transaction.rating.upsert({
        where: {
          ownerId_recipeId: {
            ownerId: userId,
            recipeId,
          },
        },
        update: { stars },
        create: {
          ownerId: userId,
          recipeId,
          stars,
        },
      });

      const aggregate = await transaction.rating.aggregate({
        where: { recipeId },
        _avg: { stars: true },
        _count: { _all: true },
      });
      const averageRating = Math.round((aggregate._avg.stars ?? 0) * 10) / 10;

      await transaction.recipe.update({
        where: { id: recipeId },
        data: { averageRating },
      });

      return {
        averageRating,
        ratingCount: aggregate._count._all,
        userRating: stars,
      };
    });

    return NextResponse.json(ratingUpdate);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while rating this recipe." },
      { status: 500 }
    );
  }
}
