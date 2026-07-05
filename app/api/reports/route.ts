import { NextResponse } from "next/server";

import { ReportReason } from "@/app/generated/prisma/enums";
import { asString } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";

type ReportBody = {
  userId?: unknown;
  recipeId?: unknown;
  title?: unknown;
  reason?: unknown;
  details?: unknown;
};

const REPORT_REASONS = Object.values(ReportReason);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReportBody;
    const userId = asString(body.userId);
    const recipeId = asString(body.recipeId);
    const title = asString(body.title);
    const reason = asString(body.reason);
    const details = asString(body.details);

    if (!userId || !recipeId) {
      return NextResponse.json(
        { error: "A user ID and recipe ID are required." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "A report name is required." },
        { status: 400 }
      );
    }

    if (!REPORT_REASONS.includes(reason as ReportReason)) {
      return NextResponse.json(
        { error: "Choose a valid report reason." },
        { status: 400 }
      );
    }

    const [reporter, recipe] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: userId,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      }),
      prisma.recipe.findFirst({
        where: {
          id: recipeId,
          isDeleted: false,
          status: "APPROVED",
        },
        select: {
          id: true,
          authorId: true,
        },
      }),
    ]);

    if (!reporter) {
      return NextResponse.json(
        { error: "Log in before reporting recipes." },
        { status: 401 }
      );
    }

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found." },
        { status: 404 }
      );
    }

    if (recipe.authorId === userId) {
      return NextResponse.json(
        { error: "You cannot report your own recipe." },
        { status: 400 }
      );
    }

    await prisma.report.create({
      data: {
        title,
        reason: reason as ReportReason,
        details: details || null,
        reporterId: userId,
        recipeId,
      },
    });

    return NextResponse.json({ message: "Report submitted." }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while submitting this report." },
      { status: 500 }
    );
  }
}
