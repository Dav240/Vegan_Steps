import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { validatePassword } from "@/lib/password-validation";
import { prisma } from "@/lib/prisma";
import { verifyEmailCodeById } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";

type ResetPasswordBody = {
  tokenId?: unknown;
  token?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "password-reset",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const body = (await request.json()) as ResetPasswordBody;
    const tokenId = typeof body.tokenId === "string" ? body.tokenId : "";
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    const tokenValidation = await verifyEmailCodeById({
      id: tokenId,
      code: token,
      purpose: "PASSWORD_RESET",
      codeFormat: "token",
      markUsed: false,
    });

    if (!tokenValidation.isValid || !tokenValidation.record.userId) {
      return NextResponse.json(
        { error: tokenValidation.error },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password, confirmPassword);

    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: tokenValidation.record.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "The verification link is invalid or expired." },
        { status: 400 }
      );
    }

    const matchesCurrentPassword = await bcrypt.compare(password, user.password);

    if (matchesCurrentPassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      }),
      prisma.emailVerificationCode.update({
        where: {
          id: tokenValidation.record.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while resetting your password." },
      { status: 500 }
    );
  }
}
