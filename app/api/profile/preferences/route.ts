import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import { defaultPrivacyPreferences } from "@/lib/legal";
import { prisma } from "@/lib/prisma";

type PreferencesBody = {
  personalisedRecommendations?: unknown;
  analytics?: unknown;
  productEmails?: unknown;
};

type PreferencesRow = {
  personalisedRecommendationsEnabled: boolean;
  analyticsEnabled: boolean;
  productEmailsEnabled: boolean;
};

export async function GET(request: Request) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  try {
    const rows = await prisma.$queryRawUnsafe<PreferencesRow[]>(
      `SELECT "personalisedRecommendationsEnabled", "analyticsEnabled", "productEmailsEnabled"
       FROM "User"
       WHERE id = $1
       LIMIT 1`,
      auth.user.id
    );
    const preferences = rows[0];

    return NextResponse.json({
      preferences: preferences
        ? {
            personalisedRecommendations:
              preferences.personalisedRecommendationsEnabled,
            analytics: preferences.analyticsEnabled,
            productEmails: preferences.productEmailsEnabled,
          }
        : defaultPrivacyPreferences,
      storageReady: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      preferences: defaultPrivacyPreferences,
      storageReady: false,
      message: "Run your Prisma migration to store privacy preferences.",
    });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  const body = (await request.json()) as PreferencesBody;
  const preferences = {
    personalisedRecommendations: body.personalisedRecommendations === true,
    analytics: body.analytics === true,
    productEmails: body.productEmails === true,
  };

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User"
       SET "personalisedRecommendationsEnabled" = $1,
           "analyticsEnabled" = $2,
           "productEmailsEnabled" = $3,
           "updatedAt" = NOW()
       WHERE id = $4`,
      preferences.personalisedRecommendations,
      preferences.analytics,
      preferences.productEmails,
      auth.user.id
    );

    return NextResponse.json({
      message: "Privacy preferences saved.",
      preferences,
      storageReady: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Run your Prisma migration before saving privacy preferences.",
        preferences,
        storageReady: false,
      },
      { status: 409 }
    );
  }
}
