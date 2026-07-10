import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

type RatingBody = {
  userId?: unknown;
  recipeId?: unknown;
  stars?: unknown;
};

export async function PUT(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "rate-recipe",
      limit: 40,
      windowMs: 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const auth = await requireUser(request);

    if (auth.response) {
      return auth.response;
    }

    const body = (await request.json()) as RatingBody;
    const recipeId = typeof body.recipeId === "string" ? body.recipeId : "";
    const stars = typeof body.stars === "number" ? body.stars : 0;
    const userId = auth.user.id;

    if (!recipeId || !Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "A recipe and rating from 1 to 5 are required." },
        { status: 400 }
      );
    }

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
        select: { id: true, authorId: true },
      }),
    ]);

    if (!user || user.isDeleted || !recipe) {
      return NextResponse.json(
        { error: !user || user.isDeleted ? "User account not found." : "Recipe not found." },
        { status: 404 }
      );
    }

    if (recipe.authorId === userId) {
      return NextResponse.json(
        { error: "You cannot rate your own recipe." },
        { status: 403 }
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
