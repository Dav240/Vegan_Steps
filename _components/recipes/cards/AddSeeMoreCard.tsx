"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import ExtraCard from "@/_components/recipes/cards/ExtraCard";
import { createRecipeDraft } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

export default function AddSeeMoreCard() {
  const router = useRouter();
  const { currentUser } = useSession();
  const [isCreating, setIsCreating] = useState(false);

  async function writeRecipe() {
    if (!currentUser.id || currentUser.userType === "VISITOR" || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      const recipeId = await createRecipeDraft(currentUser.id);
      router.push(`/recipes/write?recipeId=${encodeURIComponent(recipeId)}`);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  }

  return (
    <ExtraCard
      actions={[
        {
          label: "Write recipe",
          ariaLabel: "Create a new recipe draft",
          icon: Plus,
          onClick: writeRecipe,
          disabled: isCreating,
        },
        {
          label: "See more",
          ariaLabel: "See all of my recipes",
          icon: ArrowRight,
          href: "/my-recipes",
          iconClassName:
            "transition-transform group-hover/action:translate-x-1",
        },
      ]}
    />
  );
}
