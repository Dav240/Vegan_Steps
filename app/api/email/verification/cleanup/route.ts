import { NextResponse } from "next/server";

import { deleteExpiredEmailVerificationCodes } from "@/lib/email-verification";

export async function DELETE(request: Request) {
  const cleanupSecret = process.env.EMAIL_CLEANUP_SECRET;

  if (process.env.NODE_ENV === "production") {
    const authorization = request.headers.get("authorization");

    if (!cleanupSecret || authorization !== `Bearer ${cleanupSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }
  }

  const deletedCount = await deleteExpiredEmailVerificationCodes();

  return NextResponse.json({ deletedCount });
}
