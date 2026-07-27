"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Ellipsis, Flag, Pencil, Trash2 } from "lucide-react";

import SaveButton from "@/_components/recipes/viewing/SaveButton";
import ReportRecipeDialog from "@/_components/recipes/report/ReportRecipeDialog";
import StarsRating from "@/_components/recipes/viewing/StarsRating";
import TagBubble from "@/_components/recipes/viewing/TagBubble";
import TimeBubble from "@/_components/recipes/viewing/TimeBubble";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/_components/ui/dropdown-menu";
import { Button } from "@/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

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
  onDeleted?: (recipeId: string) => void;
  actionsMode?: "full" | "readonly";
  tagPresentation?: "compact" | "explore";
  ratingPlacement?: "side" | "below-title";
  wrapCompactTags?: boolean;
  showOwnerStatus?: boolean;
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
  onDeleted,
  actionsMode = "full",
  tagPresentation = "compact",
  ratingPlacement = "side",
  wrapCompactTags = false,
  showOwnerStatus = true,
  className,
}: RecipeCardProps) {
  const router = useRouter();
  const { currentUser } = useSession();
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const visibleTags = tags.slice(0, 3);
  const displayedTags = tagPresentation === "explore" ? tags : visibleTags;
  const recipeHref = `/recipes?recipeId=${encodeURIComponent(recipeId)}`;
  const isOwner = Boolean(currentUser.id) && currentUser.id === authorId;
  const showActions = actionsMode === "full";
  const showRatingBelowTitle = ratingPlacement === "below-title";
  const showSideColumn = showActions || !showRatingBelowTitle;

  if (isDeleted) return null;

  async function openEditor() {
    if (!currentUser.id || !isOwner || isOpeningEditor) return;

    setIsOpeningEditor(true);
    try {
      const draftId =
        status === "DRAFT" || status === "REJECTED"
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

  async function deleteRecipe() {
    if (!currentUser.id || !isOwner || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/recipes/drafts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this recipe.");
      }

      setDeleteDialogOpen(false);
      onDeleted?.(recipeId);
      if (!onDeleted) {
        setIsDeleted(true);
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete this recipe."
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <article role="link" tabIndex={0} aria-label={`View ${name}`} onClick={openRecipe} onKeyDown={handleKeyDown}
        className={cn(
          "w-full max-w-[370px] cursor-pointer self-stretch overflow-hidden rounded-lg border border-brand-berry-soft bg-brand-paper shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry",
          "brand-recipe-card",
          className
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-green-soft">
          {imageUrl ? (
            <Image src={imageUrl} alt={imageAlt || name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

        <div
          className={cn(
            "grid min-h-32 gap-4 p-4",
            showSideColumn ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"
          )}
        >
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-brand-ink">
              {name}
            </h3>

            {showRatingBelowTitle && (
              <StarsRating rating={rating} className="mt-2" />
            )}

            {tagPresentation !== "explore" && (
              <RecipeCardTags
                displayedTags={displayedTags}
                totalTags={tags.length}
                tagPresentation={tagPresentation}
                wrapCompactTags={wrapCompactTags}
              />
            )}

            {showOwnerStatus && isOwner && status && (
              <p className="mt-3 text-xs font-bold uppercase text-brand-berry-dark">
                Status: {formatStatus(status)}
              </p>
            )}
          </div>

          {showSideColumn && (
          <div className="flex min-w-[104px] flex-col items-end">
            {showActions && (
              <div className="flex items-center gap-1">
                <SaveButton recipeId={recipeId} recipeName={name} initiallySaved={initiallySaved} savedState={savedState} onSavedChange={onSavedChange}/>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label={`More options for ${name}`}
                      className="flex size-10 items-center justify-center rounded-md text-brand-berry transition-colors hover:bg-brand-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry"
                    >
                      <Ellipsis className="size-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    {isOwner ? (
                      <>
                        <DropdownMenuItem onSelect={() => void openEditor()} disabled={isOpeningEditor || isDeleting}
                          className="text-brand-green-dark focus:bg-brand-green-soft focus:text-brand-green-dark"
                        >
                          <Pencil />
                          {status === "APPROVED" ? "Make New Recipe" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeleteDialogOpen(true)}
                          disabled={isDeleting}
                          className="text-red-700 focus:bg-red-50 focus:text-red-800"
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        onSelect={() => {
                          if (onReport) {
                            onReport();
                          } else {
                            setReportDialogOpen(true);
                          }
                        }}
                        className="text-red-700 hover:bg-red-50 hover:text-red-800 focus:bg-red-50 focus:text-red-800"
                      >
                        <Flag />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {!showRatingBelowTitle && <StarsRating rating={rating} className="mt-2" />}
          </div>
          )}

          {tagPresentation === "explore" && (
            <RecipeCardTags
              displayedTags={displayedTags}
              totalTags={tags.length}
              tagPresentation={tagPresentation}
              className={cn(showSideColumn && "col-span-2")}
            />
          )}
        </div>
      </article>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false} className="overflow-hidden border-deep-crimson-200 bg-deep-crimson-50 p-0 text-brand-ink sm:max-w-md">
          <DialogHeader className="bg-brand-cream px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-deep-crimson-100 text-deep-crimson-700">
                <Trash2 className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-2xl font-bold text-brand-ink">
                  Delete recipe
                </DialogTitle>
                <DialogDescription className="mt-2 leading-6 text-zinc-700">
                  Are you sure you want to permanently delete {name || "this recipe"}?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {deleteError && (
            <p className="mx-5 mt-4 rounded-md border border-deep-crimson-200 bg-white px-3 py-2 text-sm font-medium text-deep-crimson-700">
              {deleteError}
            </p>
          )}
          <DialogFooter className="mx-0 mb-0 border-t border-deep-crimson-200 bg-deep-crimson-50 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}
              className="border-brand-berry-soft bg-white text-brand-ink hover:bg-brand-berry-soft"
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void deleteRecipe()} disabled={isDeleting}
              className="bg-deep-crimson-600 px-4 font-bold text-white hover:bg-deep-crimson-700 focus-visible:ring-deep-crimson-200"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportRecipeDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} recipeId={recipeId}
        recipeName={name}
      />
    </>
  );
}

function RecipeCardTags({
  displayedTags,
  totalTags,
  tagPresentation,
  wrapCompactTags,
  className,
}: {
  displayedTags: string[];
  totalTags: number;
  tagPresentation: "compact" | "explore";
  wrapCompactTags?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex max-w-full gap-1.5",
        tagPresentation === "explore"
          ? "flex-col items-start sm:flex-row sm:flex-wrap sm:items-center"
          : cn(
              "items-center",
              wrapCompactTags
                ? "flex-wrap overflow-visible"
                : "flex-nowrap overflow-hidden"
            ),
        className
      )}
    >
      {displayedTags.map((tag) => (
        <TagBubble
          key={tag}
          tag={tag}
          className="max-w-full shrink-0 whitespace-nowrap text-left leading-tight"
        />
      ))}
      {tagPresentation !== "explore" && totalTags > 3 && (
        <span
          className="shrink-0 px-1 text-sm font-bold text-brand-berry"
          aria-label={`${totalTags - 3} more tags`}
        >
          ...
        </span>
      )}
    </div>
  );
}

function isInteractiveTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("button, a, [role='menuitem']"));
}

function formatStatus(status: EditableRecipeStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
