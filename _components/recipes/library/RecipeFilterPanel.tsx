"use client";

import { RotateCcw } from "lucide-react";

import { formatRecipeEnum, type EditableRecipeStatus, type RecipeTag } from "@/lib/recipe-draft";
import { getRecipeTagCategories } from "@/lib/recipe-tags";
import { cn } from "@/lib/utils";

import TagCategoryGroup from "@/_components/recipes/library/TagCategoryGroup";
import TagModeSwitch from "@/_components/recipes/library/TagModeSwitch";

export type RecipeTagMode = "all" | "partial";
export type RecipeStatusFilter = Extract<
  EditableRecipeStatus,
  "DRAFT" | "PENDING" | "REJECTED" | "APPROVED"
>;

const STATUS_FILTERS: RecipeStatusFilter[] = [
  "DRAFT",
  "PENDING",
  "REJECTED",
  "APPROVED",
];

export default function RecipeFilterPanel({ minRating, maxRating, onRatingChange, selectedTags, onSelectedTagsChange, tagMode, onTagModeChange, 
  selectedStatuses,
  onSelectedStatusesChange,
  showStatusFilter = true,
  onReset,
}: {
  minRating: number;
  maxRating: number;
  onRatingChange: (minimum: number, maximum: number) => void;
  selectedTags: RecipeTag[];
  onSelectedTagsChange: (tags: RecipeTag[]) => void;
  tagMode: RecipeTagMode;
  onTagModeChange: (mode: RecipeTagMode) => void;
  selectedStatuses: RecipeStatusFilter[];
  onSelectedStatusesChange: (statuses: RecipeStatusFilter[]) => void;
  showStatusFilter?: boolean;
  onReset: () => void;
}) {
  function toggleTag(tag: RecipeTag) {
    onSelectedTagsChange(
      selectedTags.includes(tag) ? selectedTags.filter((selectedTag) => selectedTag !== tag) : [...selectedTags, tag]
    );
  }

  function toggleStatus(status: RecipeStatusFilter) {
    onSelectedStatusesChange(
      selectedStatuses.includes(status) ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status) : [...selectedStatuses, status]
    );
  }

  return (
    <section
      aria-label="Recipe filters"
      className={cn( "grid gap-6 border-b border-brand-berry-soft bg-white px-5 py-5",
        showStatusFilter ? "xl:grid-cols-[300px_96px_minmax(0,1fr)]" : "xl:grid-cols-[340px_minmax(0,1fr)]"
      )}
    >
      <div className="space-y-7">
        <fieldset>
          <legend className="text-sm font-bold uppercase text-brand-berry-dark">
            Rating range
          </legend>
          <div className="mt-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <label>
                <span className="sr-only">Minimum rating</span>
                <input type="number" min={0} max={5} step={0.1} value={minRating.toFixed(1)}
                  onChange={(event) =>
                    onRatingChange(
                      Math.min(clampRating(event.target.value, minRating), maxRating),
                      maxRating
                    )
                  }
                  className="h-10 w-full rounded-md border border-brand-berry-soft bg-white px-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green-soft"
                />
              </label>
              <span className="text-zinc-400">-</span>
              <label>
                <span className="sr-only">Maximum rating</span>
                <input type="number" min={0} max={5} step={0.1} value={maxRating.toFixed(1)}
                  onChange={(event) =>
                    onRatingChange(
                      minRating,
                      Math.max(clampRating(event.target.value, maxRating), minRating)
                    )
                  }
                  className="h-10 w-full rounded-md border border-brand-berry-soft bg-white px-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green-soft"
                />
              </label>
            </div>
            <div className="relative mt-4 h-7">
              <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-berry-soft" />
              <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-ink"
                style={{
                  left: `${ratingPercent(minRating)}%`,
                  right: `${100 - ratingPercent(maxRating)}%`,
                }}
              />
              <input type="range" min={0} max={5} step={0.1} value={minRating}
                onChange={(event) =>
                  onRatingChange(
                    Math.min(clampRating(event.target.value, minRating), maxRating),
                    maxRating
                  )
                }
                aria-label="Minimum rating"
                className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-1 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-ink [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-brand-ink [&::-webkit-slider-thumb]:shadow-sm"
              />
              <input type="range" min={0} max={5} step={0.1} value={maxRating}
                onChange={(event) =>
                  onRatingChange(
                    minRating,
                    Math.max(clampRating(event.target.value, maxRating), minRating)
                  )
                }
                aria-label="Maximum rating"
                className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-1 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-ink [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-brand-ink [&::-webkit-slider-thumb]:shadow-sm"
              />
            </div>
          </div>
        </fieldset>

      <button type="button" onClick={onReset}
        className="flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-brand-berry-soft bg-white px-4 text-sm font-semibold text-brand-berry transition-colors hover:bg-brand-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry"
      >
        <RotateCcw className="size-4" />
        Reset
      </button>
      </div>

      {showStatusFilter && (
        <fieldset>
          <legend className="text-sm font-bold uppercase text-brand-berry-dark">
            Status
          </legend>
          <div className="mt-3 flex flex-wrap gap-3 xl:flex-col xl:gap-4">
            {STATUS_FILTERS.map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <input type="checkbox" checked={selectedStatuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                  className="size-4 accent-brand-green" />
                {formatRecipeEnum(status)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset aria-label="Tag filters">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-bold uppercase text-brand-berry-dark">
            Tags
          </span>
          <TagModeSwitch mode={tagMode} onModeChange={onTagModeChange} />
        </div>
        <div className="mt-5 grid items-start gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <div className="space-y-5">
            {getRecipeTagCategories()
              .filter((category) => category.id !== "cultural_background")
              .map((category) => (
                <TagCategoryGroup
                  key={category.id}
                  category={category}
                  selectedTags={selectedTags}
                  onToggleTag={toggleTag}
                />
              ))}
          </div>

          <div>
            {getRecipeTagCategories()
              .filter((category) => category.id === "cultural_background")
              .map((category) => (
                <TagCategoryGroup
                  key={category.id}
                  category={category}
                  selectedTags={selectedTags}
                  onToggleTag={toggleTag}
                />
              ))}
          </div>
        </div>
      </fieldset>

    </section>
  );
}

function clampRating(value: string, boundary: number) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return boundary;

  const bounded = Math.min(5, Math.max(0, rating));
  return Math.round(bounded * 10) / 10;
}

function ratingPercent(value: number) {
  return (value / 5) * 100;
}
