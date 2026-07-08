import { NextResponse } from "next/server";

import { clearSessionCookie, requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "delete-account",
      limit: 5,
      windowMs: 60 * 60 * 1000,
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
      prisma.emailVerificationCode.deleteMany({
        where: {
          userId: auth.user.id,
        },
      }),
      prisma.$executeRawUnsafe(
        `UPDATE "User"
         SET "isDeleted" = true,
             "deletedAt" = NOW(),
             "personalisedRecommendationsEnabled" = false,
             "analyticsEnabled" = false,
             "productEmailsEnabled" = false,
             "optionalDataDeletedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $1`,
        auth.user.id
      ),
    ]);

    const response = NextResponse.json({
      user: {
        id: null,
        username: "Visitor",
        email: "",
        userType: "VISITOR",
      },
      message: "Your account has been queued for deletion.",
    });
    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Could not delete your account. If you have not migrated yet, run the latest Prisma migration first.",
      },
      { status: 500 }
    );
  }
}
