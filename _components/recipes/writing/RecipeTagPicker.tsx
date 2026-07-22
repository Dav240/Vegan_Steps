"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/_components/ui/dropdown-menu";
import { Input } from "@/_components/ui/input";

import { getRecipeTagCategories, getRecipeTagLabel, searchRecipeTags, type RecipeTagCategory } from "@/lib/recipe-tags";
import { MAX_RECIPE_TAGS, RECIPE_TAGS, type RecipeTag } from "@/lib/recipe-draft";

export default function RecipeTagPicker({ selectedTags, onAddTag }: {
  selectedTags: RecipeTag[];
  onAddTag: (tag: RecipeTag) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<RecipeTagCategory | null>(null);

  const availableTags = RECIPE_TAGS.filter((tag) => !selectedTags.includes(tag));
  const canAddMore =
    selectedTags.length < MAX_RECIPE_TAGS && availableTags.length > 0;
  const categoryTags = activeCategory ? activeCategory.tags.filter((tag) => !selectedTags.includes(tag)) : availableTags;
  const searchedTags = searchRecipeTags( query ? availableTags : categoryTags, query );

  function closeAndReset(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery("");
      setActiveCategory(null);
    }
  }

  function addTag(tag: RecipeTag) {
    onAddTag(tag);
    setQuery("");
    setActiveCategory(null);
    setOpen(false);
  }

  if (!canAddMore) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={closeAndReset}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Add a recipe tag" title="Add tag"
          className="flex size-8 items-center justify-center rounded-full border-2 border-brand-green bg-white text-brand-green-dark transition-colors hover:bg-brand-green-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          <Plus className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-berry" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tags"
            className="h-9 border-brand-berry-soft bg-white pl-9 text-sm focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
          />
        </div>

        <div className="mt-2 max-h-72 overflow-y-auto">
          {query ? (
            <TagResults tags={searchedTags} onAddTag={addTag} />
          ) : activeCategory ? (
            <>
              <button type="button" onClick={() => setActiveCategory(null)}
                className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-brand-berry transition-colors hover:bg-brand-berry-soft"
              >
                <ArrowLeft className="size-4" />
                {activeCategory.label}
              </button>
              <TagResults tags={searchedTags} onAddTag={addTag} />
            </>
          ) : (
            <CategoryResults
              selectedTags={selectedTags}
              onCategorySelect={setActiveCategory}
            />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryResults({ selectedTags, onCategorySelect }: {
  selectedTags: RecipeTag[];
  onCategorySelect: (category: RecipeTagCategory) => void;
}) {
  const categories = getRecipeTagCategories();

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const availableCount = category.tags.filter(
          (tag) => !selectedTags.includes(tag)
        ).length;

        return (
          <button
            key={`${category.id}-${category.label}`}
            type="button"
            onClick={() => onCategorySelect(category)}
            disabled={availableCount === 0}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span>{category.label}</span>
            <span className="text-xs text-brand-berry-dark">
              {availableCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TagResults({ tags, onAddTag }: {
  tags: RecipeTag[];
  onAddTag: (tag: RecipeTag) => void;
}) {
  if (tags.length === 0) {
    return (
      <p className="px-3 py-3 text-sm font-medium text-zinc-500">
        No matching tags.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {tags.map((tag) => (
        <DropdownMenuItem
          key={tag}
          onSelect={() => onAddTag(tag)}
          className="focus:bg-brand-green-soft focus:text-brand-green-dark"
        >
          <Plus />
          {getRecipeTagLabel(tag)}
        </DropdownMenuItem>
      ))}
    </div>
  );
}
