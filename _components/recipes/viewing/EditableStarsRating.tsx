"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import LoginWindow from "@/_components/login/LoginWindow";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";

export type RatingUpdate = {
  averageRating: number;
  ratingCount: number;
  userRating: number;
};

export default function EditableStarsRating({
  recipeId,
  initialRating = 0,
  onRatingChange,
  className,
}: {
  recipeId: string;
  initialRating?: number;
  onRatingChange?: (rating: RatingUpdate) => void;
  className?: string;
}) {
  const { currentUser } = useSession();
  const [selectedRating, setSelectedRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const canRate = Boolean(currentUser.id) && currentUser.userType !== "VISITOR";
  const displayedRating = hoveredRating || pendingRating || selectedRating;

  async function rateRecipe(stars: number) {
    if (!canRate || !currentUser.id) {
      setLoginOpen(true);
      return;
    }

    if (pendingRating !== null) {
      return;
    }

    setPendingRating(stars);

    try {
      const response = await fetch("/api/recipes/rating", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          stars,
        }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not update your rating.");
      }

      const update = data as RatingUpdate;
      setSelectedRating(update.userRating);
      onRatingChange?.(update);
    } catch (error) {
      console.error(error);
    } finally {
      setPendingRating(null);
    }
  }

  return (
    <>
      <div
        className={cn("flex items-center gap-1", className)}
        role="radiogroup"
        aria-label={canRate ? "Your recipe rating" : "Log in to rate this recipe"}
        onMouseLeave={() => setHoveredRating(0)}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          const active = value <= displayedRating;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selectedRating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              disabled={pendingRating !== null}
              onMouseEnter={() => setHoveredRating(value)}
              onFocus={() => setHoveredRating(value)}
              onBlur={() => setHoveredRating(0)}
              onClick={() => rateRecipe(value)}
              className="rounded-sm p-0.5 text-vegr-gold-dark transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry disabled:cursor-wait"
            >
              <Star
                className={cn(
                  "size-8",
                  active ? "fill-vegr-gold" : "fill-transparent"
                )}
              />
            </button>
          );
        })}
      </div>

      <LoginWindow
        open={loginOpen}
        onOpenChange={setLoginOpen}
        showTrigger={false}
        redirectAfterAuth={null}
      />
    </>
  );
}
