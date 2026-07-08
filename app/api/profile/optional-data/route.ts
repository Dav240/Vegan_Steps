import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "delete-optional-data",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const auth = await requireUser(request);

    if (auth.response) {
      return auth.response;
    }

    await prisma.$transaction([
      prisma.recipeView.deleteMany({
        where: {
          userId: auth.user.id,
        },
      }),
      prisma.$executeRawUnsafe(
        `UPDATE "User"
         SET "personalisedRecommendationsEnabled" = false,
             "analyticsEnabled" = false,
             "productEmailsEnabled" = false,
             "optionalDataDeletedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $1`,
        auth.user.id
      ),
    ]);

    return NextResponse.json({
      message: "Optional data deleted and optional preferences turned off.",
      preferences: {
        personalisedRecommendations: false,
        analytics: false,
        productEmails: false,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Could not delete optional data. If you have not migrated yet, run the latest Prisma migration first.",
      },
      { status: 500 }
    );
  }
}
