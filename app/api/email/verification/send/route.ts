import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import {
  createEmailVerificationCode,
  deleteExpiredEmailVerificationCodes,
} from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/user-validation";

type SendVerificationBody = {
  purpose?: unknown;
  email?: unknown;
  userId?: unknown;
  newEmail?: unknown;
};

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, {
      key: "email-code",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (limited) {
      return limited;
    }

    await deleteExpiredEmailVerificationCodes();

    const body = (await request.json()) as SendVerificationBody;
    const purpose = body.purpose;

    if (purpose === "REGISTER") {
      return await sendRegisterCode(body);
    }

    if (purpose === "CHANGE_EMAIL") {
      return await sendChangeEmailCodes(request, body);
    }

    return NextResponse.json(
      { error: "A valid verification purpose is required." },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while sending the verification code." },
      { status: 500 }
    );
  }
}

async function sendRegisterCode(body: SendVerificationBody) {
  const email = typeof body.email === "string" ? body.email : "";
  const emailValidation = await validateEmail(email);

  if (!emailValidation.isValid) {
    return NextResponse.json(
      { error: emailValidation.error },
      { status: 400 }
    );
  }

  const verification = await createEmailVerificationCode({
    email: emailValidation.value,
    purpose: "REGISTER",
  });

  await sendVerificationEmail({
    to: emailValidation.value,
    code: verification.code,
    subject: "Your Vegan Steps registration code",
    intro: "Use this code to finish creating your Vegan Steps account.",
  });

  return NextResponse.json({
    message: "Verification code sent.",
    expiresAt: verification.expiresAt,
  });
}

async function sendChangeEmailCodes(request: Request, body: SendVerificationBody) {
  const auth = await requireUser(request);
  const newEmail = typeof body.newEmail === "string" ? body.newEmail : "";

  if (auth.response) {
    return auth.response;
  }

  const userId = auth.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User account not found." },
      { status: 404 }
    );
  }

  const emailValidation = await validateEmail(newEmail, userId);

  if (!emailValidation.isValid) {
    return NextResponse.json(
      { error: emailValidation.error },
      { status: 400 }
    );
  }

  if (emailValidation.value === user.email) {
    return NextResponse.json(
      { error: "Enter a new email address before requesting codes." },
      { status: 400 }
    );
  }

  const oldEmailVerification = await createEmailVerificationCode({
    email: user.email,
    purpose: "CHANGE_EMAIL_OLD",
    userId,
    pendingEmail: emailValidation.value,
  });
  const newEmailVerification = await createEmailVerificationCode({
    email: emailValidation.value,
    purpose: "CHANGE_EMAIL_NEW",
    userId,
    pendingEmail: emailValidation.value,
  });

  await sendVerificationEmail({
    to: user.email,
    code: oldEmailVerification.code,
    subject: "Confirm your Vegan Steps email change",
    intro: `Use this code to confirm changing your Vegan Steps email to ${emailValidation.value}.`,
  });
  await sendVerificationEmail({
    to: emailValidation.value,
    code: newEmailVerification.code,
    subject: "Confirm your new Vegan Steps email",
    intro: "Use this code to confirm this email address for your Vegan Steps account.",
  });

  return NextResponse.json({
    message: "Verification codes sent to your current and new email addresses.",
    expiresAt: newEmailVerification.expiresAt,
  });
}
