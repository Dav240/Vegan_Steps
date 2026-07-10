"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CalendarDays, ChevronLeft, ChevronRight, ShieldCheck, Trash2 } from "lucide-react";

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

import { Button } from "@/_components/ui/button";
import RecipeImagePlaceholder from "@/_components/ui/RecipeImagePlaceholder";
import { createRecipeDraft } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

type RecipeViewData = {
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

type RecipeIngredient = {
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
    <main className={showClientNavigation ? "flex min-h-screen bg-vegr-cream" : "min-h-screen bg-vegr-cream"}>
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
                className="mb-7 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-bold uppercase text-vegr-berry transition-colors hover:bg-vegr-berry-soft hover:text-vegr-berry-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry"
              >
                <ArrowLeft className="size-4" />
                Moderator Home
              </Link>
            )}

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:gap-16">
              <section className="min-w-0">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <p className="text-sm font-semibold uppercase text-vegr-berry">
                      Recipe by {recipe.authorUsername}
                    </p>
                    <h1 className="mt-1 text-5xl font-bold text-vegr-ink md:text-6xl">
                      {recipe.name}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <TimeBubble
                      type="prep"
                      minutes={recipe.prepTimeMinutes}
                      className="h-10 border-vegr-berry-soft px-4 text-sm"
                    />
                    <TimeBubble
                      type="cook"
                      minutes={recipe.cookTimeMinutes}
                      className="h-10 border-vegr-berry-soft px-4 text-sm"
                    />
                  </div>
                </div>

                <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-vegr-berry-soft bg-vegr-green-soft">
                  {recipe.imageUrl ? (
                    <Image src={recipe.imageUrl} alt={recipe.name} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover"/>
                  ) : (
                    <RecipeImagePlaceholder iconClassName="size-20" />
                  )}
                </div>

                <div className="mt-6 inline-flex flex-col items-start">
                  <span className="text-4xl font-bold text-vegr-ink">
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
                  <CalendarDays className="size-4 text-vegr-berry" />
                  <span>Updated {formatDate(recipe.updatedAt)}</span>
                </div>
                {currentUser.id !== recipe.authorId && !isModerator && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setReportDialogOpen(true)}
                      className="text-xs font-bold uppercase text-vegr-berry hover:text-vegr-berry-dark hover:underline"
                    >
                      Report recipe
                    </button>
                  </div>
                )}

                <div className="mt-10">
                  <h2 className="font-indie-flower text-4xl font-bold text-vegr-ink">
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
                  <div className="mt-8 rounded-lg border border-vegr-berry-soft bg-vegr-berry-soft/50 px-4 py-3 shadow-sm">
                    <p className="text-xs font-bold uppercase text-vegr-berry-dark">
                      Rejection reason
                    </p>
                    <p className="mt-2 text-sm leading-6 text-vegr-ink">
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
                        className="size-12 border border-vegr-berry-soft bg-white shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void editYourOwn()}
                        disabled={isCreatingCopy}
                        className="h-12 border-vegr-berry bg-white px-6 text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark"
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
                        <h2 className="text-sm font-bold uppercase text-vegr-berry-dark">
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

function IngredientsTable({
  servings,
  ingredients,
}: {
  servings: number;
  ingredients: RecipeIngredient[];
}) {
  return (
    <section className="mt-16" aria-labelledby="ingredients-heading">
      <div className="overflow-hidden rounded-lg border border-vegr-berry-soft bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-vegr-green/20 bg-vegr-green-soft px-5 py-4">
          <h2
            id="ingredients-heading"
            className="font-indie-flower text-3xl font-bold text-vegr-ink"
          >
            Ingredients
          </h2>
          <span className="shrink-0 text-sm font-bold text-vegr-berry-dark">
            Servings: {servings}
          </span>
        </div>

        <table className="w-full border-collapse">
          <thead className="sr-only">
            <tr>
              <th scope="col">Amount</th>
              <th scope="col">Ingredient</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length > 0 ? (
              ingredients.map((ingredient) => (
                <tr
                  key={ingredient.id}
                  className="border-b border-vegr-green/15 last:border-b-0"
                >
                  <td className="w-32 px-5 py-3.5 align-top font-semibold text-vegr-green-dark">
                    {formatIngredientAmount(ingredient)}
                  </td>
                  <td className="px-5 py-3.5 text-vegr-ink">
                    {ingredient.name}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-sm text-zinc-600">
                  No ingredients have been added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModeratorReviewPanel({
  recipe,
  reportIndex,
  onReportIndexChange,
  denyReason,
  onDenyReasonChange,
  isPending,
  error,
  notice,
  onApprove,
  onDeny,
  onIgnoreReports,
  onDeleteRecipe,
  onDeleteRecipeAndBanUser,
}: {
  recipe: RecipeViewData;
  reportIndex: number;
  onReportIndexChange: (index: number) => void;
  denyReason: string;
  onDenyReasonChange: (reason: string) => void;
  isPending: boolean;
  error: string;
  notice: string;
  onApprove: () => void;
  onDeny: () => void;
  onIgnoreReports: () => void;
  onDeleteRecipe: () => void;
  onDeleteRecipeAndBanUser: () => void;
}) {
  const currentReport = recipe.reports[reportIndex] ?? null;
  const reportCount = recipe.reports.length;

  function moveReport(direction: -1 | 1) {
    if (reportCount === 0) return;
    onReportIndexChange((reportIndex + direction + reportCount) % reportCount);
  }

  return (
    <section className="mt-10 space-y-6">
      {recipe.status === "PENDING" && (
        <div className="rounded-lg border border-vegr-green/25 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase text-vegr-green-dark">
            Submitted recipe review
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onApprove}
              disabled={isPending}
              className="bg-vegr-green text-white hover:bg-vegr-green-dark"
            >
              <ShieldCheck />
              Approve
            </Button>
          </div>
          <label
            htmlFor="deny-reason"
            className="mt-5 block text-sm font-bold uppercase text-vegr-berry-dark"
          >
            Deny reason
          </label>
          <textarea
            id="deny-reason"
            value={denyReason}
            onChange={(event) => onDenyReasonChange(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-md border border-vegr-berry-soft bg-vegr-cream px-3 py-2 text-sm outline-none focus:border-vegr-berry focus:ring-2 focus:ring-vegr-berry-soft"
            placeholder="Explain what needs to change."
          />
          <Button
            type="button"
            onClick={onDeny}
            disabled={isPending}
            className="mt-3 bg-deep-crimson-600 text-white hover:bg-deep-crimson-700"
          >
            Deny
          </Button>
        </div>
      )}

      {reportCount > 0 && (
        <div className="rounded-lg border border-vegr-berry-soft bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase text-vegr-berry-dark">
                Reports
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {reportIndex + 1}/{reportCount}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => moveReport(-1)}
                aria-label="Previous report"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => moveReport(1)}
                aria-label="Next report"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {currentReport && (
            <article className="mt-4 rounded-md border border-vegr-green/20 bg-vegr-cream p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-bold text-vegr-ink">
                  {currentReport.title}
                </h3>
                <span className="text-xs font-semibold text-zinc-600">
                  {formatDateTime(currentReport.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-vegr-berry-dark">
                {formatEnum(currentReport.reason)} by{" "}
                {currentReport.reporterUsername}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {currentReport.details || "No additional details were provided."}
              </p>
            </article>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onIgnoreReports}
              disabled={isPending}
              className="border-vegr-green text-vegr-green-dark hover:bg-vegr-green-soft"
            >
              Ignore Recipe
            </Button>
            <Button
              type="button"
              onClick={onDeleteRecipe}
              disabled={isPending}
              className="bg-deep-crimson-600 text-white hover:bg-deep-crimson-700"
            >
              <Trash2 />
              Delete Recipe
            </Button>
            <Button
              type="button"
              onClick={onDeleteRecipeAndBanUser}
              disabled={isPending}
              className="bg-vegr-berry text-white hover:bg-vegr-berry-dark"
            >
              <Ban />
              Delete Recipe & Ban User
            </Button>
          </div>
        </div>
      )}

      {(error || notice) && (
        <p
          className={
            error
              ? "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              : "rounded-md border border-vegr-green/25 bg-vegr-green-soft px-4 py-3 text-sm font-semibold text-vegr-green-dark"
          }
        >
          {error || notice}
        </p>
      )}
    </section>
  );
}

function RecipeViewLoading() {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] animate-pulse gap-10 px-6 py-10 md:px-12 lg:grid-cols-2 lg:px-16">
      <div>
        <div className="h-14 w-2/3 rounded bg-vegr-berry-soft" />
        <div className="mt-6 aspect-[16/10] rounded-lg bg-vegr-green-soft" />
      </div>
      <div className="space-y-5 pt-16">
        <div className="h-9 w-1/3 rounded bg-vegr-berry-soft" />
        <div className="h-5 w-full rounded bg-vegr-green-soft" />
        <div className="h-5 w-4/5 rounded bg-vegr-green-soft" />
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEnum(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const unitLabels: Record<string, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITRE: "ml",
  LITRE: "l",
  TEASPOON: "tsp",
  TABLESPOON: "tbsp",
  CUP: "cup",
  PIECE: "piece",
  PINCH: "pinch",
  POUNDS: "lb",
  OUNCES: "oz",
  NONE: "",
};

function formatIngredientAmount(ingredient: RecipeIngredient) {
  const quantity =
    ingredient.quantity == null
      ? ""
      : new Intl.NumberFormat("en-GB", {
          maximumFractionDigits: 2,
        }).format(ingredient.quantity);
  const unit = ingredient.unit ? unitLabels[ingredient.unit] ?? ingredient.unit : "";

  return [quantity, unit].filter(Boolean).join(" ") || "To taste";
}
