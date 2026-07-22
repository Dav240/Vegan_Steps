"use client";

import Image from "next/image";
import Link from "next/link";

import LoginWindow from "@/_components/login/LoginWindow";

export default function VisitorHeader({ redirectAfterAuth = "/explore" }: { redirectAfterAuth?: string | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold border-t-8 border-t-brand-berry bg-brand-cream/95 backdrop-blur-md">
      <div className="flex h-28 w-full items-center justify-between px-8 md:px-16 lg:px-24">
        <Link href="/" className="brand-logo-link flex shrink-0 items-center" aria-label="Vegan Steps home">
          <Image
            src="/logo.png"
            alt="Vegan Steps"
            width={1110}
            height={631}
            className="h-auto w-48 object-contain sm:w-56 md:w-48"
            priority
          />
        </Link>
        <nav className="flex h-28 items-center">
          <LoginWindow redirectAfterAuth={redirectAfterAuth} />
        </nav>
      </div>
    </header>
  );
}
