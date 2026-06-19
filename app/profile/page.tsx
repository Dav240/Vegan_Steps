"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { currentUser } = useSession();

  return (
    <main className="min-h-screen bg-crimson-violet-950 px-6 py-16 text-crimson-violet-50">
      <section className="mx-auto max-w-3xl">
        <Button
          asChild
          variant="ghost"
          className="font-indie-flower text-2xl text-crimson-violet-100 hover:bg-crimson-violet-800 hover:text-white"
        >
          <Link href="/">VegR</Link>
        </Button>

        <div className="mt-12">
          <p className="text-lg font-medium text-crimson-violet-200">
            Logged in:
          </p>

          <h1 className="mt-3 font-indie-flower text-6xl font-bold text-crimson-violet-100">
            {currentUser.username}
          </h1>
        </div>
      </section>
    </main>
  );
}
