import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateEmail, validateUsername } from "@/lib/user-validation";

type ProfileUpdateBody = {
  userId?: unknown;
  field?: unknown;
  value?: unknown;
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
  const userId = new URL(request.url).searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "A user ID is required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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

    const userId = typeof body.userId === "string" ? body.userId : "";
    const field = body.field === "username" || body.field === "email" ? body.field : null;
    const value = typeof body.value === "string" ? body.value : "";

    if (!userId || !field) {
      return NextResponse.json(
        { error: "A user ID and editable field are required." },
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

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        [field]: validation.value,
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
