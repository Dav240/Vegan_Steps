"use client";

import { useState } from "react";
import Image from "next/image";
import { CookingPot, Ellipsis, Flag, Heart, Star, Timer, Utensils } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/_components/ui/dropdown-menu";


export type RecipeCardProps = {
  recipeId: string;
  name: string;
  imageUrl?: string | null;
  imageAlt?: string;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  tags: string[];
  rating: number;
  initiallySaved?: boolean;
  savedState?: boolean;
  onReport?: () => void;
  onSavedChange?: (recipeId: string, saved: boolean) => void;
  className?: string;
};

export default function RecipeCard({ recipeId, name, imageUrl, imageAlt = "", prepTimeMinutes, cookTimeMinutes, tags, rating, initiallySaved = false, savedState,
  onReport, onSavedChange, className }: RecipeCardProps) {
  const { currentUser } = useSession();
  const [confirmedSaved, setConfirmedSaved] = useState(initiallySaved);
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const visibleTags = tags.slice(0, 3);
  const canSave = Boolean(currentUser.id) && currentUser.userType !== "VISITOR";
  const isSaved = optimisticSaved ?? savedState ?? confirmedSaved;

  async function toggleSaved() {
    if (!currentUser.id || !canSave || isSaving) {
      return;
    }

    const nextSavedState = !isSaved;
    setOptimisticSaved(nextSavedState);
    setIsSaving(true);

    try {
      const response = await fetch("/api/recipes/savedrecipes", {
        method: nextSavedState ? "PUT" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          recipeId,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not update the saved recipe.");
      }

      const saved = Boolean(data.saved);
      setConfirmedSaved(saved);
      onSavedChange?.(recipeId, saved);
      setOptimisticSaved(null);
    } catch (error) {
      console.error(error);
      setOptimisticSaved(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={cn( "w-full max-w-[370px] self-stretch overflow-hidden rounded-lg border border-vegr-berry-soft bg-vegr-paper shadow-sm transition-shadow hover:shadow-md", className )}>
      <div className="relative aspect-[4/3] overflow-hidden bg-vegr-green-soft">
        {imageUrl ? (
          <Image src={imageUrl} alt={imageAlt || name} fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]" />
        ) : (
          <div className="flex size-full items-center justify-center text-vegr-green">
            <Utensils className="size-14" aria-hidden="true" />
            <span className="sr-only">No recipe image available</span>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          {prepTimeMinutes != null && (
            <TimeBadge icon={Timer} label="Prep" minutes={prepTimeMinutes}/>
          )}
          {cookTimeMinutes != null && (
            <TimeBadge icon={CookingPot} label="Cook" minutes={cookTimeMinutes}/>
          )}
        </div>
      </div>

      <div className="grid min-h-32 grid-cols-[minmax(0,1fr)_auto] gap-4 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-bold leading-6 text-vegr-ink">
            {name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag) => (
              <span key={tag}
                className="rounded-full border border-vegr-green/25 bg-vegr-green-soft px-2.5 py-1 text-xs font-semibold text-vegr-green-dark"
              >
                {formatTag(tag)}
              </span>
            ))}
            {tags.length > 3 && (
              <span
                className="px-1 text-sm font-bold text-vegr-berry"
                aria-label={`${tags.length - 3} more tags`}
              >
                ...
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-[104px] flex-col items-end">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSaved}
              disabled={!canSave || isSaving}
              aria-label={ canSave ? isSaved ? `Unsave ${name}` : `Save ${name}` : "Log in to save recipes" }
              aria-pressed={isSaved}
              title={canSave ? undefined : "Log in to save recipes"}
              className="flex size-10 items-center justify-center rounded-md text-vegr-berry transition-colors hover:bg-vegr-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Heart
                className={cn("size-6 transition-colors",
                  isSaved && "fill-red-500 text-red-500",
                  isSaving && "animate-pulse"
                )}
              />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label={`More options for ${name}`}
                  className="flex size-10 items-center justify-center rounded-md text-vegr-berry transition-colors hover:bg-vegr-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry"
                >
                  <Ellipsis className="size-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem onSelect={onReport}
                  className="text-red-700 hover:bg-red-50 hover:text-red-800 focus:bg-red-50 focus:text-red-800"
                >
                  <Flag />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <RatingStars rating={rating} />
        </div>
      </div>
    </article>
  );
}

function TimeBadge({ icon: Icon, label, minutes }: {
  icon: typeof Timer;
  label: string;
  minutes: number;
}) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full border border-white/60 bg-vegr-cream/95 px-3 text-xs font-bold text-vegr-ink shadow-sm backdrop-blur-sm">
      <Icon className="size-4 text-vegr-green" aria-hidden="true" />
      <span>
        {label}: {formatMinutes(minutes)}
      </span>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const normalizedRating = Math.min(5, Math.max(0, rating));

  return (
    <div
      className="mt-2 flex items-center gap-0.5"
      aria-label={`${normalizedRating.toFixed(1)} out of 5 stars`}
      title={`${normalizedRating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fillPercentage = Math.min(
          100,
          Math.max(0, (normalizedRating - index) * 100)
        );

        return (
          <span key={index} className="relative block size-4" aria-hidden="true">
            <Star className="absolute inset-0 size-4 fill-vegr-cream text-vegr-gold-dark" />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star className="size-4 fill-vegr-gold text-vegr-gold-dark" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function formatMinutes(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
}

function formatTag(tag: string) {
  return tag.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}
