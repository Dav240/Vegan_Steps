import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { deleteRecipeImageIfUnused } from "@/lib/recipe-image-cleanup";
import {
  MAX_RECIPE_INGREDIENTS,
  MAX_RECIPE_STEPS,
  MAX_RECIPE_TAGS,
  RECIPE_TAGS,
  RECIPE_UNITS,
  type DraftIngredient,
  type DraftInstruction,
  type RecipeDraft,
  type RecipeTag,
  type RecipeUnit,
} from "@/lib/recipe-draft";

type DraftRequestBody = {
  userId?: unknown;
  recipeId?: unknown;
  sourceRecipeId?: unknown;
  action?: unknown;
  draft?: unknown;
};

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("userId")?.trim();
    const recipeId = searchParams.get("recipeId")?.trim();

    if (!userId || !recipeId) {
      return NextResponse.json(
        { error: "A user ID and recipe ID are required." },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, authorId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        servings: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        imageUrl: true,
        imageKey: true,
        tags: true,
        status: true,
        ingredients: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
        stepsPrep: {
          orderBy: { number: "asc" },
          select: { id: true, number: true, text: true },
        },
        stepsCook: {
          orderBy: { number: "asc" },
          select: { id: true, number: true, text: true },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe draft not found." },
        { status: 404 }
      );
    }

    if (recipe.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Submitted recipes can no longer be edited." },
        { status: 409 }
      );
    }

    return NextResponse.json({ recipe: toDraftResponse(recipe) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while loading the recipe draft." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DraftRequestBody;
    const userId = asString(body.userId);
    const sourceRecipeId = asString(body.sourceRecipeId);

    if (!userId) {
      return NextResponse.json(
        { error: "A user ID is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const source = sourceRecipeId
      ? await prisma.recipe.findFirst({
          where: {
            id: sourceRecipeId,
            OR: [{ status: "APPROVED" }, { authorId: userId }],
          },
          select: {
            name: true,
            description: true,
            servings: true,
            prepTimeMinutes: true,
            cookTimeMinutes: true,
            tags: true,
            ingredients: {
              orderBy: { order: "asc" },
              take: MAX_RECIPE_INGREDIENTS,
              select: { name: true, quantity: true, unit: true, order: true },
            },
            stepsPrep: {
              orderBy: { number: "asc" },
              take: MAX_RECIPE_STEPS,
              select: { number: true, text: true },
            },
            stepsCook: {
              orderBy: { number: "asc" },
              take: MAX_RECIPE_STEPS,
              select: { number: true, text: true },
            },
          },
        })
      : null;

    if (sourceRecipeId && !source) {
      return NextResponse.json(
        { error: "Source recipe not found." },
        { status: 404 }
      );
    }

    const recipe = await prisma.recipe.create({
      data: source
        ? {
            name: `${source.name} (Copy)`,
            description: source.description,
            servings: source.servings,
            prepTimeMinutes: source.prepTimeMinutes,
            cookTimeMinutes: source.cookTimeMinutes,
            imageUrl: null,
            imageKey: null,
            tags: source.tags,
            averageRating: 0,
            authorId: userId,
            status: "DRAFT",
            ingredients: {
              create: source.ingredients.map((ingredient) => ({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                order: ingredient.order,
              })),
            },
            stepsPrep: {
              create: source.stepsPrep.map((step) => ({
                number: step.number,
                text: step.text,
              })),
            },
            stepsCook: {
              create: source.stepsCook.map((step) => ({
                number: step.number,
                text: step.text,
              })),
            },
          }
        : {
            name: "",
            description: "",
            servings: 1,
            averageRating: 0,
            authorId: userId,
            status: "DRAFT",
          },
      select: { id: true },
    });

    return NextResponse.json({ recipeId: recipe.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating the recipe draft." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as DraftRequestBody;
    const userId = asString(body.userId);
    const recipeId = asString(body.recipeId);
    const action = body.action === "submit" ? "submit" : "save";

    if (!userId || !recipeId) {
      return NextResponse.json(
        { error: "A user ID and recipe ID are required." },
        { status: 400 }
      );
    }

    const parsedDraft = parseDraft(body.draft);

    if ("error" in parsedDraft) {
      return NextResponse.json({ error: parsedDraft.error }, { status: 400 });
    }

    if (action === "submit") {
      const submissionError = validateSubmission(parsedDraft.draft);
      if (submissionError) {
        return NextResponse.json({ error: submissionError }, { status: 400 });
      }
    }

    const ownedRecipe = await prisma.recipe.findFirst({
      where: { id: recipeId, authorId: userId },
      select: { id: true, status: true },
    });

    if (!ownedRecipe) {
      return NextResponse.json(
        { error: "Recipe draft not found." },
        { status: 404 }
      );
    }

    if (ownedRecipe.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Submitted recipes can no longer be edited." },
        { status: 409 }
      );
    }

    const draft = parsedDraft.draft;

    await prisma.$transaction(async (transaction) => {
      await transaction.ingredient.deleteMany({ where: { recipeId } });
      await transaction.instructionStep.deleteMany({
        where: {
          OR: [{ prepRecipeId: recipeId }, { cookRecipeId: recipeId }],
        },
      });

      await transaction.recipe.update({
        where: { id: recipeId },
        data: {
          name: draft.name,
          description: draft.description,
          servings: draft.servings,
          prepTimeMinutes: draft.prepTimeMinutes,
          cookTimeMinutes: draft.cookTimeMinutes,
          tags: draft.tags,
          status: action === "submit" ? "PENDING" : "DRAFT",
          submittedAt: action === "submit" ? new Date() : null,
        },
      });

      if (draft.ingredients.length > 0) {
        await transaction.ingredient.createMany({
          data: draft.ingredients.map((ingredient, index) => ({
            recipeId,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            order: index + 1,
          })),
        });
      }

      if (draft.stepsPrep.length > 0) {
        await transaction.instructionStep.createMany({
          data: draft.stepsPrep.map((step, index) => ({
            prepRecipeId: recipeId,
            number: index + 1,
            text: step.text,
          })),
        });
      }

      if (draft.stepsCook.length > 0) {
        await transaction.instructionStep.createMany({
          data: draft.stepsCook.map((step, index) => ({
            cookRecipeId: recipeId,
            number: index + 1,
            text: step.text,
          })),
        });
      }
    });

    return NextResponse.json({
      recipeId,
      status: action === "submit" ? "PENDING" : "DRAFT",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while saving the recipe draft." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DraftRequestBody;
    const userId = asString(body.userId);
    const recipeId = asString(body.recipeId);

    if (!userId || !recipeId) {
      return NextResponse.json(
        { error: "A user ID and recipe ID are required." },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, authorId: userId },
      select: { id: true, imageKey: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found." },
        { status: 404 }
      );
    }

    await prisma.recipe.delete({ where: { id: recipeId } });

    if (recipe.imageKey) {
      try {
        await deleteRecipeImageIfUnused(recipe.imageKey);
      } catch (imageError) {
        console.error("Recipe deleted, but its Cloudinary image could not be removed.", imageError);
      }
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while deleting the recipe." },
      { status: 500 }
    );
  }
}

function toDraftResponse(recipe: {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  imageUrl: string | null;
  imageKey: string | null;
  tags: RecipeTag[];
  status: RecipeDraft["status"];
  ingredients: Array<{
    id: string;
    name: string;
    quantity: number | null;
    unit: RecipeUnit | null;
  }>;
  stepsPrep: DraftInstruction[];
  stepsCook: DraftInstruction[];
}): RecipeDraft {
  return {
    recipeId: recipe.id,
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    imageUrl: recipe.imageUrl,
    imageKey: recipe.imageKey,
    tags: recipe.tags,
    status: recipe.status,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      unit: ingredient.unit ?? "NONE",
    })),
    stepsPrep: recipe.stepsPrep,
    stepsCook: recipe.stepsCook,
  };
}

function parseDraft(value: unknown): { draft: RecipeDraft } | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: "Recipe draft data is required." };
  }

  const draft = value as Record<string, unknown>;
  const ingredientsInput = Array.isArray(draft.ingredients) ? draft.ingredients : [];
  const prepInput = Array.isArray(draft.stepsPrep) ? draft.stepsPrep : [];
  const cookInput = Array.isArray(draft.stepsCook) ? draft.stepsCook : [];
  const tagsInput = Array.isArray(draft.tags) ? draft.tags : [];

  if (ingredientsInput.length > MAX_RECIPE_INGREDIENTS) {
    return { error: `Recipes can have at most ${MAX_RECIPE_INGREDIENTS} ingredients.` };
  }
  if (prepInput.length > MAX_RECIPE_STEPS || cookInput.length > MAX_RECIPE_STEPS) {
    return { error: `Each instruction table can have at most ${MAX_RECIPE_STEPS} steps.` };
  }
  if (tagsInput.length > MAX_RECIPE_TAGS) {
    return { error: `Recipes can have at most ${MAX_RECIPE_TAGS} tags.` };
  }

  const servings = toNumber(draft.servings);
  const prepTimeMinutes = toOptionalNumber(draft.prepTimeMinutes);
  const cookTimeMinutes = toOptionalNumber(draft.cookTimeMinutes);

  if (!Number.isInteger(servings) || servings < 1) {
    return { error: "Servings must be a whole number of at least 1." };
  }
  if (!isValidOptionalWholeNumber(prepTimeMinutes) || !isValidOptionalWholeNumber(cookTimeMinutes)) {
    return { error: "Preparation and cooking times must be positive whole numbers." };
  }

  const tags = [...new Set(tagsInput.filter(isRecipeTag))];
  if (tags.length !== tagsInput.length) {
    return { error: "One or more selected tags are invalid or duplicated." };
  }

  const ingredients: DraftIngredient[] = [];
  for (const value of ingredientsInput) {
    if (!value || typeof value !== "object") {
      return { error: "One or more ingredients are invalid." };
    }
    const ingredient = value as Record<string, unknown>;
    const name = asString(ingredient.name);
    const quantity = toOptionalNumber(ingredient.quantity);
    const unit = isRecipeUnit(ingredient.unit) ? ingredient.unit : "NONE";
    const isBlank = !name && quantity === null && unit === "NONE";

    if (isBlank) {
      continue;
    }
    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      return { error: "Ingredient quantities cannot be negative." };
    }
    if (!name) {
      return { error: "Every ingredient with an amount needs a name." };
    }

    ingredients.push({ name, quantity, unit });
  }

  const prepSteps = parseSteps(prepInput);
  if ("error" in prepSteps) {
    return prepSteps;
  }
  const cookSteps = parseSteps(cookInput);
  if ("error" in cookSteps) {
    return cookSteps;
  }

  return {
    draft: {
      recipeId: asString(draft.recipeId),
      name: asString(draft.name),
      description: asString(draft.description),
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      imageUrl: null,
      imageKey: null,
      tags,
      ingredients,
      stepsPrep: prepSteps.steps,
      stepsCook: cookSteps.steps,
      status: "DRAFT",
    },
  };
}

function parseSteps(values: unknown[]): { steps: DraftInstruction[] } | { error: string } {
  const steps: DraftInstruction[] = [];

  for (const value of values) {
    if (!value || typeof value !== "object") {
      return { error: "One or more instruction steps are invalid." };
    }
    const text = asString((value as Record<string, unknown>).text);
    if (text) {
      steps.push({ number: steps.length + 1, text });
    }
  }

  return { steps };
}

function validateSubmission(draft: RecipeDraft) {
  if (!draft.name) return "A recipe title is required before submission.";
  if (!draft.description) return "A description is required before submission.";
  if (draft.ingredients.length === 0) return "Add at least one ingredient before submission.";
  if (draft.stepsPrep.length === 0) return "Add at least one preparation step before submission.";
  if (draft.stepsCook.length === 0) return "Add at least one cooking step before submission.";
  return "";
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return toNumber(value);
}

function isValidOptionalWholeNumber(value: number | null) {
  return value === null || (Number.isInteger(value) && value >= 0);
}

function isRecipeTag(value: unknown): value is RecipeTag {
  return typeof value === "string" && RECIPE_TAGS.some((tag) => tag === value);
}

function isRecipeUnit(value: unknown): value is RecipeUnit {
  return typeof value === "string" && RECIPE_UNITS.some((unit) => unit === value);
}
