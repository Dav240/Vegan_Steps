import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import cloudinary, { hasCloudinaryConfig } from "@/lib/cloudinary";
import {
  hasSightengineConfig,
  ImageModerationServiceError,
  moderateRecipeImage,
} from "@/lib/image-moderation";
import { prisma } from "@/lib/prisma";
import { MAX_RECIPE_IMAGE_BYTES } from "@/lib/recipe-draft";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  let uploadedImageKey = "";

  try {
    if (!hasCloudinaryConfig()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured on the server." },
        { status: 500 }
      );
    }

    if (!hasSightengineConfig()) {
      return NextResponse.json(
        { error: "Image moderation is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const userId = formData.get("userId");
    const recipeId = formData.get("recipeId");
    const file = formData.get("file");

    if (typeof userId !== "string" || typeof recipeId !== "string" || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A user, recipe, and image file are required." },
        { status: 400 }
      );
    }

    if (!allowedImageTypes.has(file.type)) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    if (file.size > MAX_RECIPE_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Recipe images must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId.trim(),
        authorId: userId.trim(),
      },
      select: {
        id: true,
        status: true,
        imageKey: true,
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

    let moderation;

    try {
      moderation = await moderateRecipeImage(file);
    } catch (error) {
      if (error instanceof ImageModerationServiceError) {
        console.error("Recipe image moderation failed.", error);
        return NextResponse.json(
          {
            error:
              "Image moderation is temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }

      throw error;
    }

    if (!moderation.approved) {
      return NextResponse.json(
        {
          error:
            "This image could not be accepted because it may contain prohibited content.",
        },
        { status: 422 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
    const uploadedImage = await cloudinary.uploader.upload(dataUri, {
      folder: "vegr/recipes",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 2000, height: 2000, crop: "limit" },
        { quality: "auto" },
      ],
    });
    uploadedImageKey = uploadedImage.public_id;

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        imageUrl: uploadedImage.secure_url,
        imageKey: uploadedImage.public_id,
      },
    });

    if (recipe.imageKey && recipe.imageKey !== uploadedImage.public_id) {
      try {
        await cloudinary.uploader.destroy(recipe.imageKey, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("The previous Cloudinary image could not be removed.", cleanupError);
      }
    }

    return NextResponse.json({
      imageUrl: uploadedImage.secure_url,
      imageKey: uploadedImage.public_id,
    });
  } catch (error) {
    console.error(error);

    if (uploadedImageKey) {
      try {
        await cloudinary.uploader.destroy(uploadedImageKey, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("A failed upload could not be cleaned up.", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Something went wrong while uploading the recipe image." },
      { status: 500 }
    );
  }
}
