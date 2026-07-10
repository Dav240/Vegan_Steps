"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  BookOpen,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  HelpCircle,
  LogOut,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";

export default function NavigationMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { setCurrentUser } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch("/api/session", {
        method: "DELETE",
      });
    } catch (error) {
      console.error(error);
    }

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
    <>
      <div className="fixed inset-x-0 top-0 z-50 md:hidden">
        <div
          className={cn(
            "mx-auto w-fit rounded-b-full border border-t-0 border-vegr-berry-dark bg-vegr-berry px-2 py-1 shadow-md",
            isMobileOpen && "rounded-b-lg"
          )}
        >
          <button
            type="button"
            onClick={() => setIsMobileOpen((open) => !open)}
            className="flex size-9 items-center justify-center rounded-md text-white transition-colors hover:bg-vegr-berry-dark"
            aria-label={isMobileOpen ? "Hide navigation" : "Show navigation"}
          >
            {isMobileOpen ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </button>
        </div>

        {isMobileOpen && (
          <nav className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-vegr-berry-dark bg-vegr-berry px-3 py-2 shadow-lg">
            <MobileNavLink href="/profile" active={pathname === "/profile"} label="Profile">
              <UserRound className="size-5" />
            </MobileNavLink>
            <MobileNavLink href="/explore" active={pathname === "/explore"} label="Explore recipes">
              <BookOpen className="size-5" />
            </MobileNavLink>
            <MobileNavLink href="/my-recipes" active={pathname === "/my-recipes"} label="My recipes">
              <ChefHat className="size-5" />
            </MobileNavLink>
            <MobileNavLink href="/saved-recipes" active={pathname === "/saved-recipes"} label="Saved recipes">
              <Heart className="size-5" />
            </MobileNavLink>
            <MobileNavLink href="/legal" active={pathname === "/legal"} label="FAQ">
              <HelpCircle className="size-5" />
            </MobileNavLink>
            <button
              type="button"
          onClick={() => void handleLogout()}
              aria-label="Logout"
              className="flex size-10 items-center justify-center rounded-full bg-deep-crimson-600 text-white transition-colors hover:bg-white hover:text-deep-crimson-600"
            >
              <LogOut className="size-5" />
            </button>
          </nav>
        )}
      </div>

      <aside
        className={cn( "sticky top-0 hidden h-dvh max-h-dvh shrink-0 self-start flex-col border-r border-vegr-berry-dark bg-vegr-berry transition-[width] duration-200 md:flex",
          isOpen ? "w-60" : "w-20"
        )}
      >
        <div className="flex h-20 items-center border-b border-white/20 px-4">
          {isOpen && (
            <Link href="/explore" className="vegr-logo-link font-indie-flower text-4xl font-bold text-white hover:text-vegr-gold-soft">
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
          <Link href="/legal" className={linkClass("/legal")}>
            <HelpCircle className="size-5 shrink-0" />
            {isOpen && <span>FAQ</span>}
          </Link>

        <button type="button" onClick={() => void handleLogout()}
            className={cn(
              "mt-2 flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-vegr-gold-soft transition-colors hover:bg-vegr-berry-dark hover:text-white",
              !isOpen && "justify-center px-0"
            )}
          >
            <LogOut className="size-5 shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileNavLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-vegr-green text-white"
          : "text-white hover:bg-white hover:text-vegr-berry"
      )}
    >
      {children}
    </Link>
  );
}
