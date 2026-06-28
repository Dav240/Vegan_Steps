"use client";

import { RotateCcw } from "lucide-react";

import { formatRecipeEnum, RECIPE_TAGS, 
  type EditableRecipeStatus,
  type RecipeTag,
} from "@/lib/recipe-draft";
import { cn } from "@/lib/utils";

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
    <section aria-label="Recipe filters" className="flex flex-wrap items-start gap-x-12 gap-y-6 border-b border-vegr-berry-soft bg-white px-5 py-5"
    >
      <fieldset className="w-full max-w-[390px]">
        <legend className="text-sm font-bold uppercase text-vegr-berry-dark">
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
                className="h-10 w-full rounded-md border border-vegr-berry-soft bg-white px-3 text-sm font-semibold text-vegr-ink outline-none focus:border-vegr-green focus:ring-2 focus:ring-vegr-green-soft"
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
                className="h-10 w-full rounded-md border border-vegr-berry-soft bg-white px-3 text-sm font-semibold text-vegr-ink outline-none focus:border-vegr-green focus:ring-2 focus:ring-vegr-green-soft"
              />
            </label>
          </div>
          <div className="relative mt-4 h-7">
            <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-vegr-berry-soft" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-vegr-ink"
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
              className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-1 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-vegr-ink [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-vegr-ink [&::-webkit-slider-thumb]:shadow-sm"
            />
            <input type="range" min={0} max={5} step={0.1} value={maxRating}
              onChange={(event) =>
                onRatingChange(
                  minRating,
                  Math.max(clampRating(event.target.value, maxRating), minRating)
                )
              }
              aria-label="Maximum rating"
              className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-1 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-vegr-ink [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-vegr-ink [&::-webkit-slider-thumb]:shadow-sm"
            />
          </div>
        </div>
      </fieldset>

      <fieldset aria-label="Tag filters" className="w-full max-w-[520px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase text-vegr-berry-dark">
            Tags
          </span>
          <TagModeSwitch mode={tagMode} onModeChange={onTagModeChange} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {RECIPE_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-green",
                  selected
                    ? "border-vegr-green bg-vegr-green text-white"
                    : "border-vegr-green/30 bg-vegr-green-soft text-vegr-green-dark hover:border-vegr-green"
                )}
              >
                {formatRecipeEnum(tag)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="w-full max-w-[430px] space-y-5">
        <fieldset>
          <legend className="text-sm font-bold uppercase text-vegr-berry-dark">
            Status
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {STATUS_FILTERS.map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm font-semibold text-vegr-ink">
                <input type="checkbox" checked={selectedStatuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                  className="size-4 accent-vegr-green" />
                {formatRecipeEnum(status)}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="button" onClick={onReset}
          className="flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-vegr-berry transition-colors hover:bg-vegr-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry"
        >
          <RotateCcw className="size-4" />
          Reset
        </button>
      </div>
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

function TagModeSwitch({ mode, onModeChange }: {
  mode: RecipeTagMode;
  onModeChange: (mode: RecipeTagMode) => void;
}) {
  const isAll = mode === "all";

  return (
    <button type="button" aria-label="Require all or any selected tags" aria-pressed={isAll}
      onClick={() => onModeChange(isAll ? "partial" : "all")}
      className={cn(
        "relative h-9 w-36 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry",
        isAll ? "bg-vegr-green-soft" : "bg-vegr-gold-soft"
      )}
    >
      <span
        className={cn( "absolute top-1 flex h-7 w-[4.75rem] items-center justify-center rounded-full text-xs font-bold uppercase text-white shadow-sm transition-all",
          isAll ? "left-1 bg-vegr-green" : "left-[calc(100%-5rem)] bg-vegr-gold-dark"
        )}
      >
        {isAll ? "All" : "Partial"}
      </span>
    </button>
  );
}
