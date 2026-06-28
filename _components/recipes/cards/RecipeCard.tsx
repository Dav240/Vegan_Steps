"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Ellipsis, Flag, Pencil } from "lucide-react";

import SaveButton from "@/_components/recipes/viewing/SaveButton";
import StarsRating from "@/_components/recipes/viewing/StarsRating";
import TagBubble from "@/_components/recipes/viewing/TagBubble";
import TimeBubble from "@/_components/recipes/viewing/TimeBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import RecipeImagePlaceholder from "@/_components/ui/RecipeImagePlaceholder";
import { createRecipeDraft, type EditableRecipeStatus } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export type RecipeCardProps = {
  recipeId: string;
  authorId?: string;
  name: string;
  imageUrl?: string | null;
  imageAlt?: string;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  tags: string[];
  rating: number;
  status?: EditableRecipeStatus;
  initiallySaved?: boolean;
  savedState?: boolean;
  onReport?: () => void;
  onSavedChange?: (recipeId: string, saved: boolean) => void;
  className?: string;
};

export default function RecipeCard({
  recipeId,
  authorId,
  name,
  imageUrl,
  imageAlt = "",
  prepTimeMinutes,
  cookTimeMinutes,
  tags,
  rating,
  status,
  initiallySaved = false,
  savedState,
  onReport,
  onSavedChange,
  className,
}: RecipeCardProps) {
  const router = useRouter();
  const { currentUser } = useSession();
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);
  const visibleTags = tags.slice(0, 3);
  const recipeHref = `/recipes?recipeId=${encodeURIComponent(recipeId)}`;
  const isOwner = Boolean(currentUser.id) && currentUser.id === authorId;

  async function openEditor() {
    if (!currentUser.id || !isOwner || isOpeningEditor) return;

    setIsOpeningEditor(true);
    try {
      const draftId =
        status === "DRAFT"
          ? recipeId
          : await createRecipeDraft(currentUser.id, recipeId);
      router.push(`/recipes/write?recipeId=${encodeURIComponent(draftId)}`);
    } catch (error) {
      console.error(error);
      setIsOpeningEditor(false);
    }
  }

  function openRecipe(event: MouseEvent<HTMLElement>) {
    if (isInteractiveTarget(event.target)) {
      return;
    }
    navigateToRecipe();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (
      event.key === "Enter" &&
      event.target === event.currentTarget
    ) {
      navigateToRecipe();
    }
  }

  function navigateToRecipe() {
    if (status === "APPROVED") {
      void fetch("/api/recipes/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
        keepalive: true,
      });
    }

    router.push(recipeHref);
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
          <RecipeImagePlaceholder />
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

          {isOwner && status && (
            <p className="mt-3 text-xs font-bold uppercase text-vegr-berry-dark">
              Status: {formatStatus(status)}
            </p>
          )}
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
                {isOwner ? (
                  <DropdownMenuItem
                    onSelect={() => void openEditor()}
                    disabled={isOpeningEditor}
                    className="text-vegr-green-dark focus:bg-vegr-green-soft focus:text-vegr-green-dark"
                  >
                    <Pencil />
                    {status === "APPROVED" ? "Make New Recipe" : "Edit"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={onReport}
                    className="text-red-700 hover:bg-red-50 hover:text-red-800 focus:bg-red-50 focus:text-red-800"
                  >
                    <Flag />
                    Report
                  </DropdownMenuItem>
                )}
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

function formatStatus(status: EditableRecipeStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
