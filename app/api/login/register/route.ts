import { prisma } from "@/lib/prisma";
import { verifyEmailCode } from "@/lib/email-verification";
import { validatePassword } from "@/lib/password-validation";
import { validateEmail, validateUsername } from "@/lib/user-validation";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type RegisterBody = {
    username?: unknown;
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
    emailCode?: unknown;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RegisterBody;

        const username = typeof body.username === "string" ? body.username : "";
        const email = typeof body.email === "string" ? body.email : "";
        const password = typeof body.password === "string" ? body.password : "";
        const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
        const emailCode = typeof body.emailCode === "string" ? body.emailCode : "";

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

        const codeValidation = await verifyEmailCode({
            email: emailValidation.value,
            purpose: "REGISTER",
            code: emailCode,
        });

        if (!codeValidation.isValid) {
            return NextResponse.json(
                { error: codeValidation.error },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email: emailValidation.value,
                emailVerified: true,
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
