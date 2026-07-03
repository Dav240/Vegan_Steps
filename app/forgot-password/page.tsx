import { notFound } from "next/navigation";

import ForgotPasswordResetForm from "@/_components/login/ForgotPasswordResetForm";
import { verifyEmailCodeById } from "@/lib/email-verification";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    tokenId?: string;
    token?: string;
  }>;
}) {
  const params = await searchParams;
  const tokenId = typeof params.tokenId === "string" ? params.tokenId : "";
  const token = typeof params.token === "string" ? params.token : "";

  const tokenValidation = await verifyEmailCodeById({
    id: tokenId,
    code: token,
    purpose: "PASSWORD_RESET",
    codeFormat: "token",
    markUsed: false,
  });

  if (!tokenValidation.isValid) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-vegr-berry text-vegr-ink">
      <div className="relative min-h-screen overflow-hidden bg-vegr-berry px-6 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,240,217,0.18),transparent_18%),radial-gradient(circle_at_87%_78%,rgba(229,240,229,0.18),transparent_20%)]" />
        <div className="absolute inset-x-[-12%] top-[-10%] h-[34%] rotate-[-8deg] bg-vegr-green shadow-2xl shadow-vegr-berry-dark/30" />
        <div className="absolute inset-x-[-10%] top-[14%] h-[21%] rotate-[7deg] bg-vegr-gold shadow-xl shadow-vegr-berry-dark/25" />
        <div className="absolute inset-x-[-14%] top-[38%] h-[24%] rotate-[-10deg] bg-vegr-berry-dark shadow-2xl shadow-black/20" />
        <div className="absolute inset-x-[-10%] top-[55%] h-[20%] rotate-[8deg] bg-vegr-green-soft shadow-xl shadow-vegr-berry-dark/25" />
        <div className="absolute inset-x-[-10%] bottom-[-8%] h-[32%] rotate-[-7deg] bg-vegr-gold shadow-2xl shadow-vegr-berry-dark/25" />
        <div className="absolute left-[-7rem] top-[53%] size-80 rounded-full border-[3.5rem] border-vegr-berry-dark bg-vegr-gold/10" />
        <div className="absolute right-[-5rem] top-[18%] size-64 rounded-full border-[2.5rem] border-vegr-green bg-vegr-cream/10" />
        <div className="absolute bottom-20 right-[9%] h-40 w-8 rotate-[18deg] bg-vegr-green" />
        <div className="absolute bottom-16 right-[12%] h-44 w-8 rotate-[18deg] bg-vegr-gold" />
        <div className="absolute bottom-12 right-[15%] h-48 w-8 rotate-[18deg] bg-vegr-berry-dark" />
        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
          <ForgotPasswordResetForm tokenId={tokenId} token={token} />
        </div>
      </div>
    </main>
  );
}
