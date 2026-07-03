import { prisma } from "@/lib/prisma";

type ValidationResult =
  | {
      isValid: false;
      error: string;
    }
  | {
      isValid: true;
      value: string;
    };

export async function validateUsername(
  username: string,
  currentUserId?: string
): Promise<ValidationResult> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return {
      isValid: false,
      error: "Username is required.",
    };
  }

  if (normalizedUsername.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters long.",
    };
  }

  if (!/^[A-Za-z0-9_]+$/.test(normalizedUsername)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }

  const existingUsername = await prisma.user.findUnique({
    where: {
      username: normalizedUsername,
    },
  });

  if (existingUsername && existingUsername.id !== currentUserId) {
    return {
      isValid: false,
      error: "This username is already taken.",
    };
  }

  return {
    isValid: true,
    value: normalizedUsername,
  };
}

export async function validateEmail(
  email: string,
  currentUserId?: string
): Promise<ValidationResult> {
  const emailFormatValidation = validateEmailFormat(email);

  if (!emailFormatValidation.isValid) {
    return emailFormatValidation;
  }

  const normalizedEmail = emailFormatValidation.value;

  const existingEmail = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingEmail && existingEmail.id !== currentUserId) {
    return {
      isValid: false,
      error: "An account with this email already exists.",
    };
  }

  return {
    isValid: true,
    value: normalizedEmail,
  };
}

export function validateEmailFormat(email: string): ValidationResult {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      isValid: false,
      error: "Email is required.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      isValid: false,
      error: "Please enter a valid email address.",
    };
  }

  return {
    isValid: true,
    value: normalizedEmail,
  };
}
