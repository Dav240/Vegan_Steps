import bcrypt from "bcryptjs";

export type PasswordValidationResult =
  | {
      isValid: false;
      error: string;
    }
  | {
      isValid: true;
    };

export function validatePassword(
  password: string,
  confirmPassword: string
): PasswordValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: "Password is required.",
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one numerical digit.",
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: "Passwords do not match.",
    };
  }

  if (bcrypt.truncates(password)) {
    return {
      isValid: false,
      error: "Password is too long. Please use a shorter password.",
    };
  }

  return {
    isValid: true,
  };
}
