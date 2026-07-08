import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth-session";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type LoginBody = {
    email?: unknown;
    password?: unknown;
};

export async function POST(request: Request) {
    try {
        const limited = rateLimit(request, {
            key: "login",
            limit: 10,
            windowMs: 15 * 60 * 1000,
        });

        if (limited) {
            return limited;
        }

        const body = (await request.json()) as LoginBody;

        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        if (user.isDeleted) {
            return NextResponse.json(
                { error: "This account is no longer active." },
                { status: 403 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        const response = NextResponse.json({
            message: "Logged in successfully.",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                userType: user.userType,
            },
        });
        setSessionCookie(response, user);

        return response;
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Something went wrong while logging in." },
            { status: 500 }
        );
    }
}
