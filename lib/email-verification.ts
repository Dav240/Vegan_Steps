import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export type EmailVerificationPurpose =
  | "REGISTER"
  | "CHANGE_EMAIL_OLD"
  | "CHANGE_EMAIL_NEW"
  | "PASSWORD_RESET";

const CODE_TTL_MINUTES = 10;
const CODE_LENGTH = 6;
const PASSWORD_RESET_TTL_MINUTES = 30;

type CodeFormat = "six-digit" | "token";

type CodeScope = {
  email: string;
  purpose: EmailVerificationPurpose;
  userId?: string | null;
  pendingEmail?: string | null;
};

export function generateEmailVerificationCode() {
  const minimum = 10 ** (CODE_LENGTH - 1);
  const maximum = 10 ** CODE_LENGTH;
  return String(randomInt(minimum, maximum));
}

export function generatePasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export async function createEmailVerificationCode(
  scope: CodeScope & {
    code?: string;
    ttlMinutes?: number;
  }
) {
  const code = scope.code ?? generateEmailVerificationCode();
  const codeHash = await bcrypt.hash(code, 12);
  const ttlMinutes =
    scope.ttlMinutes ??
    (scope.purpose === "PASSWORD_RESET"
      ? PASSWORD_RESET_TTL_MINUTES
      : CODE_TTL_MINUTES);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const email = normalizeEmail(scope.email);
  const pendingEmail = scope.pendingEmail
    ? normalizeEmail(scope.pendingEmail)
    : null;

  await prisma.emailVerificationCode.deleteMany({
    where: {
      email,
      purpose: scope.purpose,
      userId: scope.userId ?? null,
      pendingEmail,
      usedAt: null,
    },
  });

  const record = await prisma.emailVerificationCode.create({
    data: {
      email,
      purpose: scope.purpose,
      codeHash,
      userId: scope.userId ?? null,
      pendingEmail,
      expiresAt,
    },
  });

  return { id: record.id, code, expiresAt };
}

export async function verifyEmailCode(
  scope: CodeScope & { code: string; markUsed?: boolean; codeFormat?: CodeFormat }
) {
  const email = normalizeEmail(scope.email);
  const pendingEmail = scope.pendingEmail
    ? normalizeEmail(scope.pendingEmail)
    : null;
  const code = scope.code.trim();
  const codeValidation = validateCodeShape(code, scope.codeFormat ?? "six-digit");

  if (!codeValidation.isValid) {
    return codeValidation;
  }

  const record = await prisma.emailVerificationCode.findFirst({
    where: {
      email,
      purpose: scope.purpose,
      userId: scope.userId ?? null,
      pendingEmail,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!record || !(await bcrypt.compare(code, record.codeHash))) {
    return {
      isValid: false as const,
      error: "The verification code is invalid or expired.",
    };
  }

  if (scope.markUsed !== false) {
    await prisma.emailVerificationCode.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  return {
    isValid: true as const,
  };
}

export async function verifyEmailCodeById({
  id,
  code,
  purpose,
  markUsed,
  codeFormat = "six-digit",
}: {
  id: string;
  code: string;
  purpose: EmailVerificationPurpose;
  markUsed?: boolean;
  codeFormat?: CodeFormat;
}) {
  const trimmedCode = code.trim();
  const codeValidation = validateCodeShape(trimmedCode, codeFormat);

  if (!id || !codeValidation.isValid) {
    return {
      isValid: false as const,
      error: codeValidation.isValid
        ? "The verification link is invalid or expired."
        : codeValidation.error,
    };
  }

  const record = await prisma.emailVerificationCode.findFirst({
    where: {
      id,
      purpose,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!record || !(await bcrypt.compare(trimmedCode, record.codeHash))) {
    return {
      isValid: false as const,
      error: "The verification link is invalid or expired.",
    };
  }

  if (markUsed !== false) {
    await prisma.emailVerificationCode.update({
      where: {
        id: record.id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  return {
    isValid: true as const,
    record,
  };
}

export async function deleteExpiredEmailVerificationCodes() {
  const usedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.emailVerificationCode.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        {
          usedAt: {
            lt: usedCutoff,
          },
        },
      ],
    },
  });

  return result.count;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateCodeShape(code: string, codeFormat: CodeFormat) {
  if (codeFormat === "six-digit" && !/^\d{6}$/.test(code)) {
    return {
      isValid: false as const,
      error: "Enter the 6-digit verification code.",
    };
  }

  if (codeFormat === "token" && code.length < 32) {
    return {
      isValid: false as const,
      error: "The verification link is invalid or expired.",
    };
  }

  return {
    isValid: true as const,
  };
}
