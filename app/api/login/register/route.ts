import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth-session";
import { verifyEmailCode } from "@/lib/email-verification";
import { LEGAL_VERSION } from "@/lib/legal";
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
    acceptsTerms?: unknown;
    acceptsAllergenDisclaimer?: unknown;
    personalisedRecommendations?: unknown;
    analytics?: unknown;
    productEmails?: unknown;
};

export async function POST(request: Request) {
    try {
        const limited = rateLimit(request, {
            key: "register",
            limit: 5,
            windowMs: 15 * 60 * 1000,
        });

        if (limited) {
            return limited;
        }

        const body = (await request.json()) as RegisterBody;

        const username = typeof body.username === "string" ? body.username : "";
        const email = typeof body.email === "string" ? body.email : "";
        const password = typeof body.password === "string" ? body.password : "";
        const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
        const emailCode = typeof body.emailCode === "string" ? body.emailCode : "";
        const acceptsTerms = body.acceptsTerms === true;
        const acceptsAllergenDisclaimer = body.acceptsAllergenDisclaimer === true;
        const personalisedRecommendations = body.personalisedRecommendations === true;
        const analytics = body.analytics === true;
        const productEmails = body.productEmails === true;

        if (!acceptsTerms || !acceptsAllergenDisclaimer) {
            return NextResponse.json(
                {
                    error:
                        "You need to accept the Terms, Community Guidelines, and allergen disclaimer before registering.",
                },
                { status: 400 }
            );
        }

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
        await storeLegalAcceptance({
            userId: user.id,
            personalisedRecommendations,
            analytics,
            productEmails,
        });

        const response = NextResponse.json(
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
        setSessionCookie(response, user);

        return response;
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Something went wrong while creating your account." },
            { status: 500 }
        );
    }
}

async function storeLegalAcceptance({
    userId,
    personalisedRecommendations,
    analytics,
    productEmails,
}: {
    userId: string;
    personalisedRecommendations: boolean;
    analytics: boolean;
    productEmails: boolean;
}) {
    try {
        await prisma.$executeRawUnsafe(
            `UPDATE "User"
             SET "termsAcceptedAt" = NOW(),
                 "termsVersion" = $1,
                 "privacyNoticeSeenAt" = NOW(),
                 "allergenDisclaimerAcceptedAt" = NOW(),
                 "communityGuidelinesVersion" = $1,
                 "personalisedRecommendationsEnabled" = $2,
                 "analyticsEnabled" = $3,
                 "productEmailsEnabled" = $4,
                 "updatedAt" = NOW()
             WHERE id = $5`,
            LEGAL_VERSION,
            personalisedRecommendations,
            analytics,
            productEmails,
            userId
        );
    } catch (error) {
        console.warn(
            "Legal acceptance fields are not stored yet. Run the Prisma migration when ready.",
            error
        );
    }
}
