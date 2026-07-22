"use client";

import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import {
  WritingAddButton,
  WritingListHeader,
  WritingRemoveButton,
  writingInputClassName,
  writingSelectClassName,
} from "@/_components/recipes/writing/WritingListParts";
import {
  formatRecipeEnum,
  MAX_RECIPE_INGREDIENTS,
  RECIPE_UNITS,
  type DraftIngredient,
  type RecipeUnit,
} from "@/lib/recipe-draft";
import { cn } from "@/lib/utils";

export type IngredientRow = DraftIngredient & { rowId: string };

type IngredientEditorProps = {
  servings: number;
  ingredients: IngredientRow[];
  expanded?: boolean;
  className?: string;
  onServingsChange: (value: number) => void;
  onIngredientChange: (rowId: string, patch: Partial<IngredientRow>) => void;
  onIngredientAdd: () => void;
  onIngredientRemove: (rowId: string) => void;
};

export default function IngredientsEditor({
  servings,
  ingredients,
  expanded = false,
  className,
  onServingsChange,
  onIngredientChange,
  onIngredientAdd,
  onIngredientRemove,
}: IngredientEditorProps) {
  const isSplit = expanded && ingredients.length > 10;
  const firstColumn = ingredients.slice(0, 10);
  const secondColumn = ingredients.slice(10);

  const servingsInput = (
    <div className="flex shrink-0 items-center gap-2">
      <Label
        htmlFor="servings"
        className="text-sm font-bold text-brand-berry-dark"
      >
        Servings
      </Label>
      <Input
        id="servings"
        type="number"
        min={1}
        step={1}
        value={servings}
        onChange={(event) =>
          onServingsChange(Math.max(1, Number(event.target.value)))
        }
        className="h-9 w-20 border-brand-green/30 bg-white text-center"
      />
    </div>
  );

  return (
    <section className={cn("min-w-0", className)}>
      <WritingListHeader
        title="Ingredients"
        tone="green"
        accessory={servingsInput}
        standalone={isSplit}
      />

      {isSplit ? (
        <>
          <div className="mt-4 lg:hidden">
            <IngredientColumn
              ingredients={ingredients}
              standalone
              onChange={onIngredientChange}
              onRemove={onIngredientRemove}
            />
          </div>
          <div className="mt-4 hidden items-start gap-8 lg:grid lg:grid-cols-2">
            <IngredientColumn
              ingredients={firstColumn}
              standalone
              onChange={onIngredientChange}
              onRemove={onIngredientRemove}
            />
            <IngredientColumn
              ingredients={secondColumn}
              standalone
              onChange={onIngredientChange}
              onRemove={onIngredientRemove}
            />
          </div>
        </>
      ) : (
        <IngredientColumn
          ingredients={ingredients}
          onChange={onIngredientChange}
          onRemove={onIngredientRemove}
        />
      )}

      <WritingAddButton
        label="Add ingredient"
        disabled={ingredients.length >= MAX_RECIPE_INGREDIENTS}
        standalone={isSplit}
        onClick={onIngredientAdd}
      />
    </section>
  );
}

function IngredientColumn({
  ingredients,
  standalone = false,
  onChange,
  onRemove,
}: {
  ingredients: IngredientRow[];
  standalone?: boolean;
  onChange: (rowId: string, patch: Partial<IngredientRow>) => void;
  onRemove: (rowId: string) => void;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-x-auto bg-white",
        standalone
          ? "self-start rounded-lg border border-brand-berry-soft shadow-sm"
          : "border-x border-brand-berry-soft"
      )}
    >
      <div className="min-w-[540px]">
        <div className="grid grid-cols-[7rem_10rem_minmax(12rem,1fr)_3rem] border-b border-brand-green/15 text-xs uppercase text-zinc-600">
          <span className="px-4 py-2.5">Quantity</span>
          <span className="px-4 py-2.5">Unit</span>
          <span className="px-4 py-2.5">Ingredient</span>
          <span className="sr-only">Actions</span>
        </div>

        {ingredients.map((ingredient) => (
          <div
            key={ingredient.rowId}
            className="grid grid-cols-[7rem_10rem_minmax(12rem,1fr)_3rem] border-b border-brand-green/15 last:border-b-0"
          >
            <div className="px-4 py-3">
              <Input
                type="number"
                min={0}
                step="any"
                value={ingredient.quantity ?? ""}
                onChange={(event) =>
                  onChange(ingredient.rowId, {
                    quantity: numberOrNull(event.target.value),
                  })
                }
                aria-label="Ingredient quantity"
                className={writingInputClassName}
              />
            </div>
            <div className="px-4 py-3">
              <select
                value={ingredient.unit}
                onChange={(event) =>
                  onChange(ingredient.rowId, {
                    unit: event.target.value as RecipeUnit,
                  })
                }
                aria-label="Ingredient unit"
                className={writingSelectClassName}
              >
                {RECIPE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {formatRecipeEnum(unit)}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-4 py-3">
              <Input
                value={ingredient.name}
                onChange={(event) =>
                  onChange(ingredient.rowId, { name: event.target.value })
                }
                placeholder="Ingredient name"
                aria-label="Ingredient name"
                className={writingInputClassName}
              />
            </div>
            <div className="py-3 pr-2">
              <WritingRemoveButton
                label="Remove ingredient"
                onClick={() => onRemove(ingredient.rowId)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function emptyIngredient(rowId: string): IngredientRow {
  return { rowId, name: "", quantity: null, unit: "NONE" };
}

function numberOrNull(value: string) {
  return value === "" ? null : Number(value);
}
