import { NextResponse } from "next/server";

import { getActiveModerator, parsePagination, asString } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { deleteRecipeImageIfUnused } from "@/lib/recipe-image-cleanup";

type ReportActionBody = {
  moderatorId?: unknown;
  recipeId?: unknown;
  action?: unknown;
};

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const moderatorId = searchParams.get("moderatorId")?.trim() ?? "";
    const { offset, limit } = parsePagination(searchParams);
    const moderator = await getActiveModerator(moderatorId);

    if (!moderator) {
      return NextResponse.json(
        { error: "Moderator access is required." },
        { status: 403 }
      );
    }

    const where = {
      isDeleted: false,
      recipe: {
        isDeleted: false,
      },
    } as const;

    const groups = await prisma.report.groupBy({
      by: ["recipeId", "status"],
      where,
      _count: {
        _all: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        _max: {
          createdAt: "desc",
        },
      },
      skip: offset,
      take: limit,
    });

    const allGroups = await prisma.report.groupBy({
      by: ["recipeId", "status"],
      where,
      _count: {
        _all: true,
      },
    });

    const recipes = await prisma.recipe.findMany({
      where: {
        id: {
          in: groups.map((group) => group.recipeId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

    return NextResponse.json({
      entries: groups.map((group) => {
        const recipe = recipeById.get(group.recipeId);

        return {
          recipeId: group.recipeId,
          recipeName: recipe?.name ?? "Deleted recipe",
          reportCount: group._count._all,
          status: group.status,
          mostRecentReportAt: group._max.createdAt,
        };
      }),
      hasMore: offset + groups.length < allGroups.length,
      total: allGroups.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading reports." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as ReportActionBody;
    const moderatorId = asString(body.moderatorId);
    const recipeId = asString(body.recipeId);
    const action = asString(body.action);
    const moderator = await getActiveModerator(moderatorId);

    if (!moderator) {
      return NextResponse.json(
        { error: "Moderator access is required." },
        { status: 403 }
      );
    }

    if (!recipeId) {
      return NextResponse.json(
        { error: "A recipe ID is required." },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        isDeleted: false,
      },
      select: {
        id: true,
        authorId: true,
        imageKey: true,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found." },
        { status: 404 }
      );
    }

    if (action === "ignore") {
      await prisma.report.updateMany({
        where: {
          recipeId,
          isDeleted: false,
        },
        data: {
          status: "DISMISSED",
          isDeleted: true,
          resolvedById: moderator.id,
          resolvedAt: new Date(),
        },
      });

      return NextResponse.json({ message: "Reports ignored." });
    }

    if (action === "delete_recipe" || action === "delete_recipe_and_ban_user") {
      await prisma.$transaction([
        prisma.recipe.update({
          where: {
            id: recipeId,
          },
          data: {
            status: "REMOVED",
            isDeleted: true,
          },
        }),
        prisma.report.updateMany({
          where: {
            recipeId,
            isDeleted: false,
          },
          data: {
            status: "ACTION_TAKEN",
            isDeleted: true,
            resolvedById: moderator.id,
            resolvedAt: new Date(),
          },
        }),
        ...(action === "delete_recipe_and_ban_user"
          ? [
              prisma.user.update({
                where: {
                  id: recipe.authorId,
                },
                data: {
                  isDeleted: true,
                },
              }),
            ]
          : []),
      ]);

      if (recipe.imageKey) {
        try {
          await deleteRecipeImageIfUnused(recipe.imageKey, recipe.id);
        } catch (imageError) {
          console.error(
            "Recipe soft-deleted, but its Cloudinary image could not be removed.",
            imageError
          );
        }
      }

      return NextResponse.json({ message: "Moderation action applied." });
    }

    return NextResponse.json(
      { error: "Choose a valid moderation action." },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while applying the moderation action." },
      { status: 500 }
    );
  }
}
