import cloudinary, { hasCloudinaryConfig } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export async function deleteRecipeImageIfUnused(
  imageKey: string | null | undefined,
  ignoredRecipeId?: string
) {
  if (!imageKey || !hasCloudinaryConfig()) return;

  const where = ignoredRecipeId
    ? {
        imageKey,
        NOT: {
          id: ignoredRecipeId,
        },
      }
    : { imageKey };

  const recipesUsingImage = await prisma.recipe.count({ where });

  if (recipesUsingImage > 0) return;

  await cloudinary.uploader.destroy(imageKey, {
    resource_type: "image",
    invalidate: true,
  });
}
