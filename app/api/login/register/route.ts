import { prisma } from "@/lib/prisma";
import { validateEmail, validateUsername } from "@/lib/user-validation";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type RegisterBody = {
    username?: unknown;
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
};

type PasswordValidationResult =| {
    isValid: false;
    error: string;
} | {
    isValid: true;
};

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
                    email: user.email,
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
