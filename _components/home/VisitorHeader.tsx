"use client";

import Link from "next/link";

import LoginWindow from "@/_components/login/LoginWindow";

export default function VisitorHeader({
  redirectAfterAuth = "/profile",
}: {
  redirectAfterAuth?: string | null;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-vegr-gold border-t-8 border-t-vegr-berry bg-vegr-cream/95 backdrop-blur-md">
      <div className="flex h-20 w-full items-center justify-between px-8 md:px-16 lg:px-24">
        <Link
          href="/"
          className="font-indie-flower text-5xl font-bold tracking-tight text-vegr-green-dark hover:text-vegr-green"
        >
          VegR
        </Link>
        <nav className="flex h-20 items-center">
          <LoginWindow redirectAfterAuth={redirectAfterAuth} />
        </nav>
      </div>
    </header>
  );
}
