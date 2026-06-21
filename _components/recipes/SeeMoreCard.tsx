import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export default function SeeMoreCard({
  href = "/my-recipes",
  label = "See all of my recipes",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "group flex min-h-72 w-full flex-col items-center justify-center rounded-lg border border-vegr-berry-soft bg-vegr-gold-soft p-6 text-center text-vegr-ink shadow-sm transition-colors hover:border-vegr-berry hover:bg-vegr-peach focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry",
        className
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full border-2 border-vegr-berry bg-vegr-cream text-vegr-berry transition-transform group-hover:translate-x-1">
        <ArrowRight className="size-8" aria-hidden="true" />
      </span>
      <span className="mt-5 text-lg font-bold">See more</span>
    </Link>
  );
}
