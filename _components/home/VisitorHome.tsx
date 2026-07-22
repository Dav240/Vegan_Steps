"use client";

import Image from "next/image";
import { ArrowDown } from "lucide-react";

import VisitorHeader from "@/_components/home/VisitorHeader";
import ExplorePage from "@/_components/recipes/explore/ExplorePage";

export default function VisitorHome() {
  const bannerUrl = "https://res.cloudinary.com/diqefvh29/image/upload/banner_plbcgv";

  return (
    <main className="min-h-screen bg-brand-cream text-brand-ink">
      <VisitorHeader />

      <section className="flex min-h-[calc(100dvh-5rem)] flex-col bg-white text-center">
        <div className="relative min-h-[42dvh] overflow-hidden border-b-[10px] border-brand-gold">
          <Image src={bannerUrl} alt="Vegan food banner" fill className="object-cover object-center" priority/>
          <div className="absolute inset-0 bg-brand-berry-dark/45" />
          <div className="relative z-10 flex h-full min-h-[45dvh] items-center justify-center px-6 py-12">
            <div className="flex flex-col items-center">
              <h1 className="font-indie-flower text-7xl font-bold leading-none tracking-tight text-white drop-shadow-md md:text-9xl">
                Vegan Steps
              </h1>
              <p className="mt-8 text-xl font-semibold text-white md:text-2xl">
                A place for your vegan recipes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="relative z-10 mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-brand-ink md:text-5xl">
              Cook, share, and discover vegan food.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
              Vegan Steps is a simple space for finding and sharing vegan recipes, from
              quick everyday meals to creative plant-based favourites. Browse
              public recipes, save ideas, and share your own dishes with the
              community!
            </p>

            <a href="#explore"
              className="mx-auto mt-10 flex size-14 animate-bounce items-center justify-center rounded-full border border-brand-green bg-white text-brand-green shadow-sm transition-colors hover:bg-brand-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              aria-label="Jump to Explore recipes" 
            >
              <ArrowDown className="size-7" />
            </a>
          </div>
        </div>
      </section>

      <ExplorePage variant="visitor" />
    </main>
  );
}
