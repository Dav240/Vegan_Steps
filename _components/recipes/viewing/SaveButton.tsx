"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import LoginWindow from "@/_components/login/LoginWindow";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";

export default function SaveButton({ recipeId, recipeName, initiallySaved = false, savedState, onSavedChange, className }: {
  recipeId: string;
  recipeName: string;
  initiallySaved?: boolean;
  savedState?: boolean;
  onSavedChange?: (recipeId: string, saved: boolean) => void;
  className?: string;
}) {
  const { currentUser } = useSession();
  const [confirmedSaved, setConfirmedSaved] = useState(initiallySaved);
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const canSave = Boolean(currentUser.id) && currentUser.userType !== "VISITOR";
  const isSaved = optimisticSaved ?? savedState ?? confirmedSaved;

  async function toggleSaved() {
    if (!canSave || !currentUser.id) {
      setLoginOpen(true);
      return;
    }

    if (isSaving) {
      return;
    }

    const nextSavedState = !isSaved;
    setOptimisticSaved(nextSavedState);
    setIsSaving(true);

    try {
      const response = await fetch("/api/recipes/savedrecipes", {
        method: nextSavedState ? "PUT" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
        }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not update the saved recipe.");
      }

      const saved = Boolean(data.saved);
      setConfirmedSaved(saved);
      onSavedChange?.(recipeId, saved);
      setOptimisticSaved(null);
    } catch (error) {
      console.error(error);
      setOptimisticSaved(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleSaved}
        disabled={isSaving}
        aria-label={ canSave ? isSaved ? `Unsave ${recipeName}` : `Save ${recipeName}` : `Log in to save ${recipeName}` }
        aria-pressed={isSaved}
        className={cn(
          "flex size-10 items-center justify-center rounded-md text-vegr-berry transition-colors hover:bg-vegr-berry-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegr-berry disabled:cursor-wait disabled:opacity-60",
          className
        )}
      >
        <Heart
          className={cn( "size-6 transition-colors", isSaved && "fill-red-500 text-red-500", isSaving && "animate-pulse" )}
        />
      </button>

      <LoginWindow open={loginOpen} onOpenChange={setLoginOpen} showTrigger={false} redirectAfterAuth={null}/>
    </>
  );
}
