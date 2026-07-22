import { cn } from "@/lib/utils";
import { type RecipeTagMode } from "@/_components/recipes/library/RecipeFilterPanel";

export default function TagModeSwitch({ 
    mode, 
    onModeChange
} : {
  mode: RecipeTagMode;
  onModeChange: (mode: RecipeTagMode) => void;
}) {
  const isAll = mode === "all";

  return (
    <button type="button" aria-label="Require all or any selected tags" aria-pressed={isAll}
      onClick={() => onModeChange(isAll ? "partial" : "all")}
      className={cn(
        "relative h-9 w-36 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-berry",
        isAll ? "bg-brand-green-soft" : "bg-brand-gold-soft"
      )}
    >
      <span
        className={cn( "absolute top-1 flex h-7 w-[4.75rem] items-center justify-center rounded-full text-xs font-bold uppercase text-white shadow-sm transition-all",
          isAll ? "left-1 bg-brand-green" : "left-[calc(100%-5rem)] bg-brand-gold-dark"
        )}
      >
        {isAll ? "All" : "Partial"}
      </span>
    </button>
  );
}