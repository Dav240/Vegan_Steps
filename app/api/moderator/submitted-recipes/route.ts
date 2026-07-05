import { NextResponse } from "next/server";

import { getActiveModerator, parsePagination, asString } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";

type SubmissionActionBody = {
  moderatorId?: unknown;
  recipeId?: unknown;
  action?: unknown;
  rejectionReason?: unknown;
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
      status: "PENDING" as const,
      isDeleted: false,
      author: {
        isDeleted: false,
      },
    };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: {
          submittedAt: "desc",
        },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          submittedAt: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    return NextResponse.json({
      entries: recipes.map((recipe) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        submittedAt: recipe.submittedAt,
        authorUsername: recipe.author.username,
      })),
      hasMore: offset + recipes.length < total,
      total,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading submitted recipes." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as SubmissionActionBody;
    const moderatorId = asString(body.moderatorId);
    const recipeId = asString(body.recipeId);
    const action = asString(body.action);
    const rejectionReason = asString(body.rejectionReason);
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
        status: "PENDING",
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Submitted recipe not found." },
        { status: 404 }
      );
    }

    if (action === "approve") {
      await prisma.recipe.update({
        where: {
          id: recipeId,
        },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: moderator.id,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      return NextResponse.json({ message: "Recipe approved." });
    }

    if (action === "deny") {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: "A rejection reason is required." },
          { status: 400 }
        );
      }

      await prisma.recipe.update({
        where: {
          id: recipeId,
        },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason,
          approvedAt: null,
          approvedById: null,
        },
      });

      return NextResponse.json({ message: "Recipe rejected." });
    }

    return NextResponse.json(
      { error: "Choose a valid submission action." },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while reviewing this recipe." },
      { status: 500 }
    );
  }
}
