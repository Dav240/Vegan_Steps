import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-session";
import { verifyEmailCode } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { validateEmail, validateUsername } from "@/lib/user-validation";

type ProfileUpdateBody = {
  userId?: unknown;
  field?: unknown;
  value?: unknown;
  oldEmailCode?: unknown;
  newEmailCode?: unknown;
};

function userResponse(user: {
  id: string;
  username: string;
  email: string;
  userType: "CLIENT" | "MODERATOR";
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    userType: user.userType,
  };
}

export async function GET(request: Request) {
  const auth = await requireUser(request);

  if (auth.response) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: auth.user.id,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User account not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user: userResponse(user),
  });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as ProfileUpdateBody;

    const auth = await requireUser(request);
    const field = body.field === "username" || body.field === "email" ? body.field : null;
    const value = typeof body.value === "string" ? body.value : "";
    const oldEmailCode = typeof body.oldEmailCode === "string" ? body.oldEmailCode : "";
    const newEmailCode = typeof body.newEmailCode === "string" ? body.newEmailCode : "";

    if (auth.response) {
      return auth.response;
    }

    const userId = auth.user.id;

    if (!field) {
      return NextResponse.json(
        { error: "An editable field is required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const validation =
      field === "username"
        ? await validateUsername(value, userId)
        : await validateEmail(value, userId);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (field === "email") {
      if (validation.value === existingUser.email) {
        return NextResponse.json(
          { error: "Enter a new email address before confirming the change." },
          { status: 400 }
        );
      }

      const oldCodeValidation = await verifyEmailCode({
        email: existingUser.email,
        purpose: "CHANGE_EMAIL_OLD",
        userId,
        pendingEmail: validation.value,
        code: oldEmailCode,
        markUsed: false,
      });

      if (!oldCodeValidation.isValid) {
        return NextResponse.json(
          { error: `Current email code: ${oldCodeValidation.error}` },
          { status: 400 }
        );
      }

      const newCodeValidation = await verifyEmailCode({
        email: validation.value,
        purpose: "CHANGE_EMAIL_NEW",
        userId,
        pendingEmail: validation.value,
        code: newEmailCode,
        markUsed: false,
      });

      if (!newCodeValidation.isValid) {
        return NextResponse.json(
          { error: `New email code: ${newCodeValidation.error}` },
          { status: 400 }
        );
      }

      await verifyEmailCode({
        email: existingUser.email,
        purpose: "CHANGE_EMAIL_OLD",
        userId,
        pendingEmail: validation.value,
        code: oldEmailCode,
      });
      await verifyEmailCode({
        email: validation.value,
        purpose: "CHANGE_EMAIL_NEW",
        userId,
        pendingEmail: validation.value,
        code: newEmailCode,
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        [field]: validation.value,
        ...(field === "email" ? { emailVerified: true } : {}),
      },
    });

    return NextResponse.json({
      message: `${field === "username" ? "Username" : "Email"} updated successfully.`,
      user: userResponse(updatedUser),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while updating your profile." },
      { status: 500 }
    );
  }
}
