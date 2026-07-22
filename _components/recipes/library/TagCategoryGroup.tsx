import { getRecipeTagCategories, getRecipeTagLabel } from "@/lib/recipe-tags";
import { type RecipeTag } from "@/lib/recipe-draft";
import { cn } from "@/lib/utils";

export default function TagCategoryGroup({ category,
  selectedTags,
  onToggleTag,
} : {
  category: ReturnType<typeof getRecipeTagCategories>[number];
  selectedTags: RecipeTag[];
  onToggleTag: (tag: RecipeTag) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-brand-berry">
        {category.label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {category.tags.length > 0 ? (
          category.tags.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
                  selected ? "border-brand-green bg-brand-green text-white" : "border-brand-green/30 bg-brand-green-soft text-brand-green-dark hover:border-brand-green"
                )}
              >
                {getRecipeTagLabel(tag)}
              </button>
            );
          })
        ) : (
          <span className="text-sm font-medium text-zinc-400">
            No tags yet.
          </span>
        )}
      </div>
    </div>
  );
}