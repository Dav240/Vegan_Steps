"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import LoginWindow from "@/components/login/LoginWindow";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useSession } from "@/lib/session";


export default function VisitorHome() {
  const { currentUser } = useSession();
  const bannerUrl = "/banner.jpeg";
  const isClient = currentUser.userType === "CLIENT";

  return (
    <main className="min-h-screen bg-crimson-violet-950 text-crimson-violet-50">
      <header className="sticky top-0 z-50 border-b border-crimson-violet-800/80 bg-crimson-violet-950/90 backdrop-blur-md">
        <div className="flex h-20 w-full items-center justify-between px-8 md:px-16 lg:px-24">
          <Link href="/" className="font-indie-flower text-5xl font-bold tracking-tight text-crimson-violet-200 hover:text-crimson-violet-100">
            VegR
          </Link>

          <nav className="flex h-20 items-center gap-4">
            <Button asChild variant="ghost" className="font-indie-flower text-2xl text-crimson-violet-100 hover:bg-crimson-violet-800 hover:text-white">
              <Link href="/">Home</Link>
            </Button>

            <Button asChild variant="ghost"className="font-indie-flower text-2xl text-crimson-violet-100 hover:bg-crimson-violet-800 hover:text-white">
              <Link href="/recipes">
                Browse
              </Link>
            </Button>

            {isClient ? <ProfileHeader /> : <LoginWindow />}
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden">
        <Image src={bannerUrl} alt="Vegan food banner" fill className="object-cover" priority/>

        <div className="absolute inset-0 bg-crimson-violet-950/55" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
          <h1 className="font-indie-flower text-7xl font-bold tracking-tight md:text-9xl">
            VegR
          </h1>

          <p className="mt-6 text-xl font-medium md:text-2xl mt-15">
            A place for your vegan recipes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-crimson-violet-200 md:text-4xl">
          Cook, share, and discover vegan food.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-crimson-violet-100">
          VegR is a simple space for finding and sharing vegan recipes, from
          quick everyday meals to creative plant-based favourites. Browse public
          recipes, save ideas, and share your own dishes with the community.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Button asChild className="bg-princeton-orange-500 text-white hover:bg-princeton-orange-600">
            <Link href="/recipes">Browse Recipes</Link>
          </Button>

          <Button asChild variant="outline" className="border-crimson-violet-300 bg-transparent text-crimson-violet-100 hover:bg-crimson-violet-800 hover:text-white">
            <Link href="/login">Get Started</Link>
          </Button>
        </div>


        {currentUser.userType!="VISITOR" && (
          <p className="mt-6 text-lg font-medium text-crimson-violet-100">
            Logged in: {currentUser.username}
          </p>
        )}
      </section>
    </main>
  );
}
