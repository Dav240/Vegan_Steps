"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import ExtraCard from "@/_components/recipes/cards/ExtraCard";
import { createRecipeDraft } from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";

export default function AddCard({ className }: { className?: string }) {
  const router = useRouter();
  const { currentUser } = useSession();
  const [isCreating, setIsCreating] = useState(false);

  async function createRecipe() {
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
      className={className}
      actions={[
        {
          label: "Write recipe",
          ariaLabel: "Create a new recipe draft",
          icon: Plus,
          onClick: createRecipe,
          disabled: isCreating,
        },
      ]}
    />
  );
}
