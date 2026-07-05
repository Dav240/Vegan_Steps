import { prisma } from "@/lib/prisma";

export const MODERATION_PAGE_SIZE = 20;

export async function getActiveModerator(userId: string) {
  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      userType: "MODERATOR",
      isDeleted: false,
    },
    select: {
      id: true,
      username: true,
    },
  });
}

export function parsePagination(searchParams: URLSearchParams) {
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? MODERATION_PAGE_SIZE);

  return {
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    limit:
      Number.isInteger(limit) && limit > 0
        ? Math.min(limit, MODERATION_PAGE_SIZE)
        : MODERATION_PAGE_SIZE,
  };
}

export function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
