import { NextResponse } from "next/server";

import {
  createEmailVerificationCode,
  deleteExpiredEmailVerificationCodes,
  generatePasswordResetToken,
} from "@/lib/email-verification";
import { sendPasswordResetEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmailFormat } from "@/lib/user-validation";

type ForgotPasswordBody = {
  email?: unknown;
};

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "password-forgot",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    const body = (await request.json()) as ForgotPasswordBody;
    const email = typeof body.email === "string" ? body.email : "";
    const emailValidation = validateEmailFormat(email);

    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    await deleteExpiredEmailVerificationCodes();

    const user = await prisma.user.findUnique({
      where: {
        email: emailValidation.value,
      },
    });

    if (user) {
      const token = generatePasswordResetToken();
      const resetCode = await createEmailVerificationCode({
        email: user.email,
        purpose: "PASSWORD_RESET",
        userId: user.id,
        code: token,
      });
      const resetUrl = new URL("/forgot-password", request.url);

      resetUrl.searchParams.set("tokenId", resetCode.id);
      resetUrl.searchParams.set("token", token);

      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: resetUrl.toString(),
      });
    }

    return NextResponse.json({
      message: "Email sent.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while sending the reset email." },
      { status: 500 }
    );
  }
}
