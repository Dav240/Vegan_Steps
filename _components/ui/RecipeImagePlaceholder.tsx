import { ImagePlus, Utensils } from "lucide-react";

import { cn } from "@/lib/utils";

export default function RecipeImagePlaceholder({
  variant = "recipe",
  className,
  iconClassName,
}: {
  variant?: "recipe" | "upload";
  className?: string;
  iconClassName?: string;
}) {
  const Icon = variant === "upload" ? ImagePlus : Utensils;

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center",
        variant === "upload"
          ? "bg-vegr-green-soft text-vegr-green-dark"
          : "text-vegr-green",
        className
      )}
    >
      <Icon
        className={cn("size-14", iconClassName)}
        aria-hidden="true"
      />
      <span className="sr-only">
        {variant === "upload"
          ? "No recipe image uploaded"
          : "No recipe image available"}
      </span>
    </div>
  );
}
