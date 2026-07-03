import {
  Tag,
  Unit,
  type Tag as PrismaTag,
  type Unit as PrismaUnit,
} from "@/app/generated/prisma/enums";

export const MAX_RECIPE_INGREDIENTS = 20;
export const MAX_RECIPE_STEPS = 10;
export const MAX_RECIPE_TAGS = 10;
export const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024;

export const RECIPE_UNITS = Object.values(Unit) as readonly PrismaUnit[];
export const RECIPE_TAGS = Object.values(Tag) as readonly PrismaTag[];

export type RecipeUnit = PrismaUnit;
export type RecipeTag = PrismaTag;
export type EditableRecipeStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";

export type DraftIngredient = {
  id?: string;
  name: string;
  quantity: number | null;
  unit: RecipeUnit;
};

export type DraftInstruction = {
  id?: string;
  number: number;
  text: string;
};

export type RecipeDraft = {
  recipeId: string;
  name: string;
  description: string;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  imageUrl: string | null;
  imageKey: string | null;
  tags: RecipeTag[];
  ingredients: DraftIngredient[];
  stepsPrep: DraftInstruction[];
  stepsCook: DraftInstruction[];
  status: EditableRecipeStatus;
};

export async function createRecipeDraft(userId: string, sourceRecipeId?: string) {
  const response = await fetch("/api/recipes/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sourceRecipeId }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not create a recipe draft.");
  }

  return data.recipeId as string;
}

export function formatRecipeEnum(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}
