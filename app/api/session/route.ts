import { NextResponse } from "next/server";

import { clearSessionCookie, getCurrentUser } from "@/lib/auth-session";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);

  return NextResponse.json({
    user: user ?? {
      id: null,
      username: "Visitor",
      email: "",
      userType: "VISITOR",
    },
  });
}

export async function DELETE() {
  const response = NextResponse.json({
    user: {
      id: null,
      username: "Visitor",
      email: "",
      userType: "VISITOR",
    },
  });

  clearSessionCookie(response);

  return response;
}
