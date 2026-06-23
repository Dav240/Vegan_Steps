import type { RecipeStatus, Tag } from "@/app/generated/prisma/enums";

export const recipeCardSelect = {
  id: true,
  authorId: true,
  name: true,
  imageUrl: true,
  prepTimeMinutes: true,
  cookTimeMinutes: true,
  tags: true,
  averageRating: true,
  status: true,
} as const;

type RecipeCardRecord = {
  id: string;
  authorId: string;
  name: string;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: Tag[];
  averageRating: unknown;
  status: RecipeStatus;
};

export function toRecipeCard(
  recipe: RecipeCardRecord,
  initiallySaved: boolean
) {
  return {
    recipeId: recipe.id,
    authorId: recipe.authorId,
    name: recipe.name,
    imageUrl: recipe.imageUrl,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    tags: recipe.tags,
    rating: Number(recipe.averageRating),
    status: recipe.status,
    initiallySaved,
  };
}
