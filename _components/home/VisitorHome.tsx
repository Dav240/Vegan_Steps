"use client";

import Link from "next/link";
import Image from "next/image";

import LoginWindow from "@/_components/login/LoginWindow";
import { Button } from "@/_components/ui/button";

export default function VisitorHome() {
  const bannerUrl = "/banner.jpeg";

  return (
    <main className="min-h-screen bg-vegr-cream text-vegr-ink">
      <header className="sticky top-0 z-50 border-b border-vegr-gold border-t-8 border-t-vegr-berry bg-vegr-cream/95 backdrop-blur-md">
        <div className="flex h-20 w-full items-center justify-between px-8 md:px-16 lg:px-24">
          <Link href="/"
            className="font-indie-flower text-5xl font-bold tracking-tight text-vegr-green-dark hover:text-vegr-green"
          >
            VegR
          </Link>

          <nav className="flex h-20 items-center">
            <LoginWindow />
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden">
        <Image src={bannerUrl} alt="Vegan food banner" fill className="object-cover" priority/>

        <div className="absolute inset-0 bg-vegr-berry-dark/55" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
          <h1 className="font-indie-flower text-7xl font-bold tracking-tight md:text-9xl">
            VegR
          </h1>

          <p className="mt-15 text-xl font-medium md:text-2xl">
            A place for your vegan recipes.
          </p>
        </div>
      </section>

      <section className="border-t-[10px] border-vegr-gold px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-vegr-ink md:text-4xl">
            Cook, share, and discover vegan food.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
            VegR is a simple space for finding and sharing vegan recipes, from
            quick everyday meals to creative plant-based favourites. Browse
            public recipes, save ideas, and share your own dishes with the
            community.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Button asChild className="bg-vegr-green text-white hover:bg-vegr-green-dark">
              <Link href="/recipes">Browse Recipes</Link>
            </Button>

            <Button asChild variant="outline"
              className="border-vegr-berry bg-white text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark"
            >
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
