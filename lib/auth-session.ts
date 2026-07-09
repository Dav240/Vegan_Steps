import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  userType: "CLIENT" | "MODERATOR";
};

const SESSION_COOKIE_NAME = "vegr_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export function setSessionCookie(
  response: NextResponse,
  user: Pick<AuthenticatedUser, "id">
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: signSessionPayload({
      userId: user.id,
      expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function assertSessionCookieConfig() {
  getSessionSecret();
}

export async function getCurrentUser(
  request: Request
): Promise<AuthenticatedUser | null> {
  const cookie = getCookie(request, SESSION_COOKIE_NAME);
  let payload: SessionPayload | null = null;

  try {
    payload = cookie ? verifySessionCookie(cookie) : null;
  } catch (error) {
    console.error("Session cookie could not be verified.", error);
    return null;
  }

  if (!payload || payload.expiresAt <= Date.now()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    select: {
      id: true,
      username: true,
      email: true,
      userType: true,
      isDeleted: true,
    },
  });

  if (!user || user.isDeleted) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    userType: user.userType,
  };
}

export async function requireUser(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Log in before continuing." },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

export async function requireModerator(request: Request) {
  const { user, response } = await requireUser(request);

  if (response) {
    return { user: null, response };
  }

  if (user.userType !== "MODERATOR") {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Moderator access is required." },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}

function signSessionPayload(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifySessionCookie(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<SessionPayload>;

    if (typeof payload.userId !== "string" || typeof payload.expiresAt !== "number") {
      return null;
    }

    return {
      userId: payload.userId,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return "";
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...valueParts] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return "";
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production.");
  }

  return "dev-only-vegr-session-secret-change-before-deployment";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
