import { CookingPot, Soup } from "lucide-react";

import { cn } from "@/lib/utils";

export type RecipeInstruction = {
  id: string;
  number: number;
  text: string;
};

export default function InstructionTable({ type, steps, className }: {
  type: "prep" | "cook";
  steps: RecipeInstruction[];
  className?: string;
}) {
  const Icon = type === "prep" ? Soup : CookingPot;
  const title = type === "prep" ? "Preparation Instructions" : "Cooking Instructions";

  return (
    <section
      className={cn( "overflow-hidden rounded-lg border border-vegr-berry-soft bg-white shadow-sm", className )}
      aria-labelledby={`${type}-instructions-heading`}>
      <div className="flex min-h-20 items-center gap-3 border-b border-vegr-berry-soft bg-vegr-berry-soft/55 px-5 py-4">
        <Icon className="size-7 shrink-0 text-vegr-green-dark" aria-hidden="true" />
        <h2 id={`${type}-instructions-heading`} className="font-indie-flower text-3xl font-bold text-vegr-ink">
          {title}
        </h2>
      </div>

      <ol>
        {steps.length > 0 ? (
          steps.map((step) => (
            <li key={step.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-vegr-green/15 px-5 py-4 last:border-b-0">
              <span className="font-indie-flower text-2xl font-bold leading-6 text-vegr-green-dark">
                {step.number}.
              </span>
              <p className="leading-6 text-vegr-ink">{step.text}</p>
            </li>
          ))
        ) : (
          <li className="px-5 py-6 text-sm text-zinc-600">
            No {type === "prep" ? "preparation" : "cooking"} instructions have been added yet.
          </li>
        )}
      </ol>
    </section>
  );
}
