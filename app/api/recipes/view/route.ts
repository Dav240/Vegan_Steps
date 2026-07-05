import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { recipeCardSelect } from "@/lib/recipe-card-data";

const recipeSelect = {
  ...recipeCardSelect,
  isDeleted: true,
  description: true,
  servings: true,
  updatedAt: true,
  rejectionReason: true,
  author: {
    select: {
      username: true,
      isDeleted: true,
    },
  },
  reports: {
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
    select: {
      id: true,
      title: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      reporter: {
        select: {
          username: true,
        },
      },
    },
  },
  ingredients: {
    orderBy: {
      order: "asc" as const,
    },
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
    },
  },
  stepsPrep: {
    orderBy: {
      number: "asc" as const,
    },
    select: {
      id: true,
      number: true,
      text: true,
    },
  },
  stepsCook: {
    orderBy: {
      number: "asc" as const,
    },
    select: {
      id: true,
      number: true,
      text: true,
    },
  },
  savedBy: {
    select: {
      userId: true,
    },
  },
  ratings: {
    select: {
      stars: true,
    },
  },
  _count: {
    select: {
      ratings: true,
    },
  },
} as const;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const recipeId = searchParams.get("recipeId");
    const userId = searchParams.get("userId")?.trim() ?? "";
    const viewer = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, userType: true, isDeleted: true },
        })
      : null;
    const activeUserId = viewer && !viewer.isDeleted ? viewer.id : "";
    const isModerator =
      viewer?.userType === "MODERATOR" && viewer.isDeleted === false;

    if (!recipeId?.trim()) {
      return NextResponse.json(
        { error: "A recipe ID is required." },
        { status: 400 }
      );
    }

    const userRelations = {
      savedBy: {
        where: {
          userId: activeUserId,
        },
        take: 1,
        select: recipeSelect.savedBy.select,
      },
      ratings: {
        where: {
          ownerId: activeUserId,
        },
        take: 1,
        select: recipeSelect.ratings.select,
      },
    };

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId.trim() },
      select: {
        ...recipeSelect,
        ...userRelations,
      },
    });

    if (!recipe || recipe.isDeleted || recipe.author.isDeleted) {
      return NextResponse.json(
        { error: "Recipe not found." },
        { status: 404 }
      );
    }

    const isAuthor = Boolean(activeUserId) && recipe.authorId === activeUserId;

    if (
      recipe.status !== "APPROVED" &&
      !isAuthor &&
      !isModerator
    ) {
      return NextResponse.json(
        { error: "Recipe not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      recipe: {
        recipeId: recipe.id,
        authorId: recipe.authorId,
        name: recipe.name,
        description: recipe.description,
        servings: recipe.servings,
        imageUrl: recipe.imageUrl,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        tags: recipe.tags,
        averageRating: Number(recipe.averageRating),
        status: recipe.status,
        rejectionReason: recipe.rejectionReason,
        ratingCount: recipe._count.ratings,
        userRating: recipe.ratings[0]?.stars ?? 0,
        initiallySaved: recipe.savedBy.length > 0,
        authorUsername: recipe.author.username,
        ingredients: recipe.ingredients,
        stepsPrep: recipe.stepsPrep,
        stepsCook: recipe.stepsCook,
        updatedAt: recipe.updatedAt,
        reports: isModerator
          ? recipe.reports.map((report) => ({
              id: report.id,
              title: report.title,
              reason: report.reason,
              details: report.details,
              status: report.status,
              createdAt: report.createdAt,
              reporterUsername: report.reporter.username,
            }))
          : [],
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading this recipe." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { recipeId?: unknown };
    const recipeId =
      typeof body.recipeId === "string" ? body.recipeId.trim() : "";

    if (!recipeId) {
      return NextResponse.json(
        { error: "A recipe ID is required." },
        { status: 400 }
      );
    }

    const result = await prisma.recipe.updateMany({
      where: {
        id: recipeId,
        status: "APPROVED",
        isDeleted: false,
      },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return NextResponse.json({ counted: result.count === 1 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while recording this recipe view." },
      { status: 500 }
    );
  }
}
