import { NextResponse } from "next/server";

import {
  createEmailVerificationCode,
  deleteExpiredEmailVerificationCodes,
} from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/user-validation";

type SendVerificationBody = {
  purpose?: unknown;
  email?: unknown;
  userId?: unknown;
  newEmail?: unknown;
};

export async function POST(request: Request) {
  try {
    await deleteExpiredEmailVerificationCodes();

    const body = (await request.json()) as SendVerificationBody;
    const purpose = body.purpose;

    if (purpose === "REGISTER") {
      return await sendRegisterCode(body);
    }

    if (purpose === "CHANGE_EMAIL") {
      return await sendChangeEmailCodes(body);
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
    subject: "Your VegR registration code",
    intro: "Use this code to finish creating your VegR account.",
  });

  return NextResponse.json({
    message: "Verification code sent.",
    expiresAt: verification.expiresAt,
  });
}

async function sendChangeEmailCodes(body: SendVerificationBody) {
  const userId = typeof body.userId === "string" ? body.userId : "";
  const newEmail = typeof body.newEmail === "string" ? body.newEmail : "";

  if (!userId) {
    return NextResponse.json(
      { error: "A user ID is required." },
      { status: 400 }
    );
  }

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
    subject: "Confirm your VegR email change",
    intro: `Use this code to confirm changing your VegR email to ${emailValidation.value}.`,
  });
  await sendVerificationEmail({
    to: emailValidation.value,
    code: newEmailVerification.code,
    subject: "Confirm your new VegR email",
    intro: "Use this code to confirm this email address for your VegR account.",
  });

  return NextResponse.json({
    message: "Verification codes sent to your current and new email addresses.",
    expiresAt: newEmailVerification.expiresAt,
  });
}
