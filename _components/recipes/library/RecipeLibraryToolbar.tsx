"use client";

import { Check, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/_components/ui/dropdown-menu";
import { Input } from "@/_components/ui/input";
import { cn } from "@/lib/utils";

export type RecipeLibrarySort = "recent" | "popular" | "rated";

const sortOptions: Array<{ value: RecipeLibrarySort; label: string }> = [
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Popularity" },
  { value: "rated", label: "Highest Rated" },
];

export default function RecipeLibraryToolbar({ search, onSearchChange, sort, onSortChange, filtersOpen, onFiltersOpenChange, activeFilterCount }: {
  search: string;
  onSearchChange: (value: string) => void;
  sort: RecipeLibrarySort;
  onSortChange: (value: RecipeLibrarySort) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  activeFilterCount: number;
}) {
  const selectedSort = sortOptions.find((option) => option.value === sort)!;

  return (
    <div className="flex flex-col gap-3 border-y border-brand-berry-soft py-4 lg:flex-row lg:items-end">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search recipes</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-green-dark" />
        <Input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search recipes"
          className="h-11 rounded-md border-brand-green/30 bg-white pl-10 pr-4 text-base focus-visible:border-brand-green focus-visible:ring-brand-green/20"
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-brand-berry-dark">
            Sort by
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button"
                className="flex h-11 min-w-52 items-center justify-between gap-3 rounded-md border border-brand-berry-soft bg-white px-4 text-sm 
                font-semibold text-brand-ink transition-colors hover:bg-brand-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry"
              >
                <span>{selectedSort.label}</span>
                <ChevronDown className="size-4 text-brand-berry" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              {sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} onSelect={() => onSortChange(option.value)}>
                  <Check className={cn( "text-brand-green opacity-0", sort === option.value && "opacity-100" )}/>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </label>

        <button
          type="button"
          onClick={() => onFiltersOpenChange(!filtersOpen)}
          aria-expanded={filtersOpen}
          className={cn(
            "relative flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry",
            filtersOpen || activeFilterCount > 0 ? "border-brand-green bg-brand-green-soft text-brand-green-dark" : "border-brand-berry-soft bg-white text-brand-ink hover:bg-brand-berry-soft"
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-green text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
