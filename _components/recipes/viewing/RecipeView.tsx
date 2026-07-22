"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import NavigationMenu from "@/_components/NavigationMenu";
import VisitorHeader from "@/_components/home/VisitorHeader";
import LoginWindow from "@/_components/login/LoginWindow";
import ReportRecipeDialog from "@/_components/recipes/report/ReportRecipeDialog";

import EditableStarsRating, { type RatingUpdate } from "@/_components/recipes/viewing/EditableStarsRating";
import InstructionTable, { type RecipeInstruction } from "@/_components/recipes/viewing/InstructionTable";
import SaveButton from "@/_components/recipes/viewing/SaveButton";
import StarsRating from "@/_components/recipes/viewing/StarsRating";
import TagBubble from "@/_components/recipes/viewing/TagBubble";
import TimeBubble from "@/_components/recipes/viewing/TimeBubble";
import ModeratorReviewPanel from "@/_components/recipes/viewing/ModeratorReviewPanel";
import IngredientsTable from "@/_components/recipes/viewing/IngredientsTable";
import RecipeViewLoading from "@/_components/recipes/viewing/RecipeViewLoading";

import { Button } from "@/_components/ui/button";
import RecipeImagePlaceholder from "@/_components/ui/RecipeImagePlaceholder";
import { createRecipeDraft } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

export type RecipeViewData = {
  recipeId: string;
  name: string;
  description: string;
  servings: number;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: string[];
  averageRating: number;
  ratingCount: number;
  userRating: number;
  initiallySaved: boolean;
  authorId: string;
  authorUsername: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";
  rejectionReason: string | null;
  ingredients: RecipeIngredient[];
  stepsPrep: RecipeInstruction[];
  stepsCook: RecipeInstruction[];
  updatedAt: string;
  reports: RecipeReport[];
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
};

type RecipeReport = {
  id: string;
  title: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporterUsername: string;
};

export default function RecipeView({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const { currentUser } = useSession();
  const [recipe, setRecipe] = useState<RecipeViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [isCreatingCopy, setIsCreatingCopy] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportIndex, setReportIndex] = useState(0);
  const [moderationError, setModerationError] = useState("");
  const [moderationNotice, setModerationNotice] = useState("");
  const [isModerating, setIsModerating] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  const isLoggedIn =
    Boolean(currentUser.id) && currentUser.userType !== "VISITOR";
  const isModerator = currentUser.userType === "MODERATOR";
  const showClientNavigation = isLoggedIn && !isModerator;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    params.set("recipeId", recipeId);
    fetch(`/api/recipes/view?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load this recipe.");
        }

        return data.recipe as RecipeViewData;
      })
      .then((loadedRecipe) => {
        setRecipe(loadedRecipe);
        setReportIndex(0);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentUser.id, recipeId]);

  function handleSavedChange(_recipeId: string, saved: boolean) {
    setRecipe((currentRecipe) =>
      currentRecipe ? { ...currentRecipe, initiallySaved: saved } : currentRecipe
    );
  }

  function handleRatingChange(update: RatingUpdate) {
    setRecipe((currentRecipe) =>
      currentRecipe
        ? {
            ...currentRecipe,
            averageRating: update.averageRating,
            ratingCount: update.ratingCount,
            userRating: update.userRating,
          }
        : currentRecipe
    );
  }

  async function editYourOwn() {
    if (!currentUser.id || currentUser.userType === "VISITOR") {
      setLoginOpen(true);
      return;
    }

    if (isCreatingCopy) return;

    setIsCreatingCopy(true);
    setCopyError("");
    try {
      const draftId = await createRecipeDraft(currentUser.id, recipeId);
      router.push(`/recipes/write?recipeId=${encodeURIComponent(draftId)}`);
    } catch (copyRequestError) {
      setCopyError(
        copyRequestError instanceof Error
          ? copyRequestError.message
          : "Could not copy this recipe."
      );
      setIsCreatingCopy(false);
    }
  }

  async function reviewSubmission(action: "approve" | "deny") {
    if (!currentUser.id || !recipe || isModerating) return;
    if (action === "deny" && !denyReason.trim()) {
      setModerationError("Add a reason before denying this recipe.");
      return;
    }

    setIsModerating(true);
    setModerationError("");
    setModerationNotice("");

    try {
      const response = await fetch("/api/moderator/submitted-recipes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipe.recipeId,
          action,
          rejectionReason: denyReason,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update this recipe.");
      }

      setRecipe((currentRecipe) =>
        currentRecipe
          ? {
              ...currentRecipe,
              status: action === "approve" ? "APPROVED" : "REJECTED",
              rejectionReason: action === "deny" ? denyReason : null,
            }
          : currentRecipe
      );
      setModerationNotice(
        action === "approve" ? "Recipe approved." : "Recipe denied."
      );
    } catch (requestError) {
      setModerationError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update this recipe."
      );
    } finally {
      setIsModerating(false);
    }
  }

  async function handleReportAction(
    action: "ignore" | "delete_recipe" | "delete_recipe_and_ban_user"
  ) {
    if (!currentUser.id || !recipe || isModerating) return;

    setIsModerating(true);
    setModerationError("");
    setModerationNotice("");

    try {
      const response = await fetch("/api/moderator/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipe.recipeId,
          action,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update these reports.");
      }

      router.replace("/moderator");
    } catch (requestError) {
      setModerationError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update these reports."
      );
      setIsModerating(false);
    }
  }

  return (
    <main className={showClientNavigation ? "flex min-h-screen bg-brand-cream" : "min-h-screen bg-brand-cream"}>
      {showClientNavigation && <NavigationMenu />}

      <div className="min-w-0 flex-1">
        {!isLoggedIn && <VisitorHeader redirectAfterAuth={null} />}

        {isLoading ? (
          <RecipeViewLoading />
        ) : error || !recipe ? (
          <div className="px-6 py-16 md:px-12 lg:px-16">
            <p className="font-medium text-red-700">
              {error || "Recipe not found."}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1500px] px-6 py-10 md:px-12 lg:px-16">
            {isModerator && (
              <Link
                href="/moderator"
                className="mb-7 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-bold uppercase text-brand-berry transition-colors hover:bg-brand-berry-soft hover:text-brand-berry-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry"
              >
                <ArrowLeft className="size-4" />
                Moderator Home
              </Link>
            )}

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:gap-16">
              <section className="min-w-0">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-sm font-semibold uppercase text-brand-berry">
                      Recipe by {recipe.authorUsername}
                    </p>
                    <h1 className="mt-1 text-5xl font-bold text-brand-ink md:text-6xl">
                      {recipe.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <TimeBubble
                      type="prep"
                      minutes={recipe.prepTimeMinutes}
                      className="h-10 border-brand-berry-soft px-4 text-sm"
                    />
                    <TimeBubble
                      type="cook"
                      minutes={recipe.cookTimeMinutes}
                      className="h-10 border-brand-berry-soft px-4 text-sm"
                    />
                  </div>
                </div>

                <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-brand-berry-soft bg-brand-green-soft">
                  {recipe.imageUrl ? (
                    <Image src={recipe.imageUrl} alt={recipe.name} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover"/>
                  ) : (
                    <RecipeImagePlaceholder iconClassName="size-20" />
                  )}
                </div>

                <div className="mt-6 inline-flex flex-col items-start">
                  <span className="text-4xl font-bold text-brand-ink">
                    {recipe.averageRating.toFixed(1)}
                  </span>
                  <StarsRating
                    rating={recipe.averageRating}
                    size="md"
                    className="mt-2"
                  />
                  <span className="mt-2 text-sm text-zinc-600">
                    {recipe.ratingCount} total rating
                    {recipe.ratingCount === 1 ? "" : "s"}
                  </span>
                </div>
              </section>

              <section className="min-w-0 pt-1">
                <div className="flex items-center justify-end gap-2 text-sm text-zinc-600">
                  <CalendarDays className="size-4 text-brand-berry" />
                  <span>Updated {formatDate(recipe.updatedAt)}</span>
                </div>
                {currentUser.id !== recipe.authorId && !isModerator && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setReportDialogOpen(true)}
                      className="text-xs font-bold uppercase text-brand-berry hover:text-brand-berry-dark hover:underline"
                    >
                      Report recipe
                    </button>
                  </div>
                )}

                <div className="mt-10">
                  <h2 className="font-indie-flower text-4xl font-bold text-brand-ink">
                    Description
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
                    {recipe.description || "No description has been added yet."}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <TagBubble
                      key={tag}
                      tag={tag}
                      className="px-3 py-1.5 text-sm"
                    />
                  ))}
                </div>

                {recipe.rejectionReason && (
                  <div className="mt-8 rounded-lg border border-brand-berry-soft bg-brand-berry-soft/50 px-4 py-3 shadow-sm">
                    <p className="text-xs font-bold uppercase text-brand-berry-dark">
                      Rejection reason
                    </p>
                    <p className="mt-2 text-sm leading-6 text-brand-ink">
                      {recipe.rejectionReason}
                    </p>
                  </div>
                )}

                {!isModerator && (
                  <>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <SaveButton
                        recipeId={recipe.recipeId}
                        recipeName={recipe.name}
                        initiallySaved={recipe.initiallySaved}
                        savedState={recipe.initiallySaved}
                        onSavedChange={handleSavedChange}
                        className="size-12 border border-brand-berry-soft bg-white shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void editYourOwn()}
                        disabled={isCreatingCopy}
                        className="h-12 border-brand-berry bg-white px-6 text-brand-berry hover:bg-brand-berry-soft hover:text-brand-berry-dark"
                      >
                        {isCreatingCopy ? "Creating copy..." : "Make New Recipe"}
                      </Button>
                    </div>
                    {copyError && (
                      <p className="mt-3 text-sm font-medium text-red-700">
                        {copyError}
                      </p>
                    )}

                    {currentUser.id !== recipe.authorId && (
                      <div className="mt-9">
                        <h2 className="text-sm font-bold uppercase text-brand-berry-dark">
                          {isLoggedIn ? "Your rating" : "Log in to rate"}
                        </h2>
                        <EditableStarsRating
                          key={`${recipe.recipeId}-${currentUser.id ?? "visitor"}-${recipe.userRating}`}
                          recipeId={recipe.recipeId}
                          initialRating={recipe.userRating}
                          onRatingChange={handleRatingChange}
                          className="mt-3"
                        />
                      </div>
                    )}
                  </>
                )}

                <IngredientsTable
                  servings={recipe.servings}
                  ingredients={recipe.ingredients}
                />
                {isModerator && (
                  <ModeratorReviewPanel
                    recipe={recipe}
                    reportIndex={reportIndex}
                    onReportIndexChange={setReportIndex}
                    denyReason={denyReason}
                    onDenyReasonChange={setDenyReason}
                    isPending={isModerating}
                    error={moderationError}
                    notice={moderationNotice}
                    onApprove={() => void reviewSubmission("approve")}
                    onDeny={() => void reviewSubmission("deny")}
                    onIgnoreReports={() => void handleReportAction("ignore")}
                    onDeleteRecipe={() => void handleReportAction("delete_recipe")}
                    onDeleteRecipeAndBanUser={() =>
                      void handleReportAction("delete_recipe_and_ban_user")
                    }
                  />
                )}
              </section>
            </div>

            <div className="mt-20 grid items-start gap-8 lg:grid-cols-2">
              <InstructionTable type="prep" steps={recipe.stepsPrep} />
              <InstructionTable type="cook" steps={recipe.stepsCook} />
            </div>
          </div>
        )}
      </div>

      <LoginWindow
        open={loginOpen}
        onOpenChange={setLoginOpen}
        showTrigger={false}
        redirectAfterAuth={null}
      />
      {recipe && (
        <ReportRecipeDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          recipeId={recipe.recipeId}
          recipeName={recipe.name}
        />
      )}
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
