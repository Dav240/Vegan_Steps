import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type RegisterBody = {
    username?: unknown;
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
};

type ValidationResult = | {
    isValid: false;
    error: string;
} | {
    isValid: true;
    value: string;
};

type PasswordValidationResult =| {
    isValid: false;
    error: string;
} | {
    isValid: true;
};

async function validateUsername(username: string): Promise<ValidationResult> {
    const normalizedUsername = username.trim().toLowerCase();

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

    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
        return {
            isValid: false,
            error: "Username can only contain lowercase letters, numbers, and underscores.",
        };
    }

    const existingUsername = await prisma.user.findUnique({
        where: {
            username: normalizedUsername,
        },
    });

    if (existingUsername) {
        return {
            isValid: false,
            error: "This username is already taken.",
        };
    }

    return {
        isValid: true,
        value: username,
    };
}

async function validateEmail(email: string): Promise<ValidationResult> {
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

    const existingEmail = await prisma.user.findUnique({
        where: {
            email: normalizedEmail,
        },
    });

    if (existingEmail) {
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

function validatePassword( password: string, confirmPassword: string ): PasswordValidationResult {
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

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RegisterBody;

        const username = typeof body.username === "string" ? body.username : "";
        const email = typeof body.email === "string" ? body.email : "";
        const password = typeof body.password === "string" ? body.password : "";
        const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

        const usernameValidation = await validateUsername(username);

        if (!usernameValidation.isValid) {
            return NextResponse.json(
                { error: usernameValidation.error },
                { status: 400 }
            );
        }

        const emailValidation = await validateEmail(email);

        if (!emailValidation.isValid) {
            return NextResponse.json(
                { error: emailValidation.error },
                { status: 400 }
            );
        }

        const passwordValidation = validatePassword(password, confirmPassword);

        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: passwordValidation.error },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email: emailValidation.value,
                username: usernameValidation.value,
                password: hashedPassword,
                userType: "CLIENT",
            },
        });

        return NextResponse.json(
            {
                message: "Account created successfully.",
                user: {
                    id: user.id,
                    username: user.username,
                    userType: user.userType,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Something went wrong while creating your account." },
            { status: 500 }
        );
    }
}
