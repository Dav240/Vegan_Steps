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

  if (password.length < 8 || password.length > 25 || bcrypt.truncates(password)) {
    return {
      isValid: false,
      error: "Password must be 8 to 25 characters long.",
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
      error: "Password must contain at least one special character, e.g. ! @ # ?.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number, 0-9.",
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: "Passwords do not match.",
    };
  }

  return {
    isValid: true,
  };
}
