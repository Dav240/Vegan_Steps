"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { BookOpen, ChefHat, ChevronLeft, ChevronRight, Heart, LogOut, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";

export default function NavigationMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { setCurrentUser } = useSession();
  const [isOpen, setIsOpen] = useState(true);

  function handleLogout() {
    setCurrentUser({
      id: null,
      username: "Visitor",
      email: "",
      userType: "VISITOR",
    });
    router.replace("/");
  }

  const linkClass = (href: string) =>
    cn( "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
      pathname === href ? "bg-vegr-green text-white" : "text-vegr-cream hover:bg-vegr-berry-dark hover:text-white",
      !isOpen && "justify-center px-0"
    );

  return (
    <aside
      className={cn( "sticky top-0 flex h-dvh max-h-dvh shrink-0 self-start flex-col border-r border-vegr-berry-dark bg-vegr-berry transition-[width] duration-200",
        isOpen ? "w-60" : "w-20"
      )}
    >
      <div className="flex h-20 items-center border-b border-white/20 px-4">
        {isOpen && (
          <Link href="/profile" className="font-indie-flower text-4xl font-bold text-white hover:text-vegr-gold-soft">
            VegR
          </Link>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={cn( "ml-auto flex size-9 items-center justify-center rounded-md text-white transition-colors hover:bg-vegr-berry-dark hover:text-vegr-gold-soft",
            !isOpen && "mx-auto"
          )}
          aria-label={isOpen ? "Collapse navigation" : "Expand navigation"}
        >
          {isOpen ? (
            <ChevronLeft className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </button>
      </div>

      <nav className="space-y-2 p-3">
        <Link href="/profile" className={linkClass("/profile")}>
          <UserRound className="size-5 shrink-0" />
          {isOpen && <span>Profile</span>}
        </Link>

        <Link href="/explore" className={linkClass("/explore")}>
          <BookOpen className="size-5 shrink-0" />
          {isOpen && <span>Explore Recipes</span>}
        </Link>

        <Link href="/my-recipes" className={linkClass("/my-recipes")}>
          <ChefHat className="size-5 shrink-0" />
          {isOpen && <span>My Recipes</span>}
        </Link>

        <Link href="/saved-recipes" className={linkClass("/saved-recipes")}>
          <Heart className="size-5 shrink-0" />
          {isOpen && <span>Saved Recipes</span>}
        </Link>
      </nav>

      <div className="mt-auto p-3">
        <button type="button" onClick={handleLogout}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-vegr-gold-soft transition-colors hover:bg-vegr-berry-dark hover:text-white",
            !isOpen && "justify-center px-0"
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
