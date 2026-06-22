"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Ellipsis, Flag, Utensils } from "lucide-react";

import SaveButton from "@/_components/recipes/ui/SaveButton";
import StarsRating from "@/_components/recipes/ui/StarsRating";
import TagBubble from "@/_components/recipes/ui/TagBubble";
import TimeBubble from "@/_components/recipes/ui/TimeBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

export default function RecipeCard({
  recipeId,
  name,
  imageUrl,
  imageAlt = "",
  prepTimeMinutes,
  cookTimeMinutes,
  tags,
  rating,
  initiallySaved = false,
  savedState,
  onReport,
  onSavedChange,
  className,
}: RecipeCardProps) {
  const router = useRouter();
  const visibleTags = tags.slice(0, 3);
  const recipeHref = `/recipes?recipeId=${encodeURIComponent(recipeId)}`;

  function openRecipe(event: MouseEvent<HTMLElement>) {
    if (isInteractiveTarget(event.target)) {
      return;
    }
    router.push(recipeHref);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (
      event.key === "Enter" &&
      event.target === event.currentTarget
    ) {
      router.push(recipeHref);
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`View ${name}`}
      onClick={openRecipe}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full max-w-[370px] cursor-pointer self-stretch overflow-hidden rounded-lg border border-vegr-berry-soft bg-vegr-paper shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-vegr-green-soft">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-vegr-green">
            <Utensils className="size-14" aria-hidden="true" />
            <span className="sr-only">No recipe image available</span>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          <TimeBubble type="prep" minutes={prepTimeMinutes} />
          <TimeBubble type="cook" minutes={cookTimeMinutes} />
        </div>
      </div>

      <div className="grid min-h-32 grid-cols-[minmax(0,1fr)_auto] gap-4 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-bold leading-6 text-vegr-ink">
            {name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag) => (
              <TagBubble key={tag} tag={tag} />
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
            <SaveButton
              recipeId={recipeId}
              recipeName={name}
              initiallySaved={initiallySaved}
              savedState={savedState}
              onSavedChange={onSavedChange}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`More options for ${name}`}
                  className="flex size-10 items-center justify-center rounded-md text-vegr-berry transition-colors hover:bg-vegr-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry"
                >
                  <Ellipsis className="size-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem
                  onSelect={onReport}
                  className="text-red-700 hover:bg-red-50 hover:text-red-800 focus:bg-red-50 focus:text-red-800"
                >
                  <Flag />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <StarsRating rating={rating} className="mt-2" />
        </div>
      </div>
    </article>
  );
}

function isInteractiveTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("button, a, [role='menuitem']"));
}
