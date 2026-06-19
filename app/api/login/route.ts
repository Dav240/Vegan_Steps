import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type LoginBody = {
    email?: unknown;
    password?: unknown;
};

export async function POST(request: Request) {
    try {
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

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: "Logged in successfully.",
            user: {
                id: user.id,
                username: user.username,
                userType: user.userType,
            },
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Something went wrong while logging in." },
            { status: 500 }
        );
    }
}
