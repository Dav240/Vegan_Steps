"use client";

import { CookingPot, Soup } from "lucide-react";

import { Input } from "@/_components/ui/input";
import {
  WritingAddButton,
  WritingListHeader,
  WritingRemoveButton,
  writingInputClassName,
} from "@/_components/recipes/writing/WritingListParts";
import { MAX_RECIPE_STEPS } from "@/lib/recipe-draft";

export type InstructionRow = {
  rowId: string;
  text: string;
};

export default function InstructionsEditor({
  type,
  steps,
  onChange,
  onAdd,
  onRemove,
}: {
  type: "prep" | "cook";
  steps: InstructionRow[];
  onChange: (rowId: string, text: string) => void;
  onAdd: () => void;
  onRemove: (rowId: string) => void;
}) {
  const Icon = type === "prep" ? Soup : CookingPot;
  const title =
    type === "prep" ? "Preparation Instructions" : "Cooking Instructions";

  return (
    <section className="min-w-0">
      <WritingListHeader title={title} icon={Icon} />

      <div className="border-x border-brand-berry-soft bg-white">
        {steps.map((step, index) => (
          <div
            key={step.rowId}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_3rem] border-b border-brand-green/15 last:border-b-0"
          >
            <span className="px-5 py-4 font-indie-flower text-2xl font-bold leading-6 text-brand-green-dark">
              {index + 1}.
            </span>
            <div className="py-3 pr-2">
              <Input
                value={step.text}
                onChange={(event) => onChange(step.rowId, event.target.value)}
                placeholder="Instruction step"
                aria-label={`${title} step ${index + 1}`}
                className={writingInputClassName}
              />
            </div>
            <div className="py-3 pr-2">
              <WritingRemoveButton
                label={`Remove ${title.toLowerCase()} step ${index + 1}`}
                onClick={() => onRemove(step.rowId)}
              />
            </div>
          </div>
        ))}
      </div>

      <WritingAddButton
        label={`Add ${title.toLowerCase()} step`}
        disabled={steps.length >= MAX_RECIPE_STEPS}
        onClick={onAdd}
      />
    </section>
  );
}

export function emptyInstruction(rowId: string): InstructionRow {
  return { rowId, text: "" };
}
