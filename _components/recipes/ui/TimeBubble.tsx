import { CookingPot, Timer } from "lucide-react";

import { cn } from "@/lib/utils";

export default function TimeBubble({ type, minutes, className }: {
  type: "prep" | "cook";
  minutes?: number | null;
  className?: string;
}) {
  const Icon = type === "prep" ? Timer : CookingPot;
  const label = type === "prep" ? "Prep" : "Cook";

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-full border border-white/60 bg-vegr-cream/95 px-3 text-xs font-bold text-vegr-ink shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <Icon className="size-4 text-vegr-green" aria-hidden="true" />
      <span>
        {label}: {formatMinutes(minutes)}
      </span>
    </div>
  );
}

function formatMinutes(minutes?: number | null) {
  if (minutes == null) {
    return "Not set";
  }

  const safeMinutes = Math.max(0, Math.round(minutes));

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
}
