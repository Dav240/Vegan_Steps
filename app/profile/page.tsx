"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import NavigationMenu from "@/_components/NavigationMenu";
import MyRecipesProfile from "@/_components/profile/MyRecipesProfile";
import ProfileDetails from "@/_components/profile/ProfileDetails";
import SavedRecipesProfile from "@/_components/profile/SavedRecipesProfile";
import { useSession } from "@/lib/session";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser } = useSession();
  const [savedRecipesVersion, setSavedRecipesVersion] = useState(0);
  const [savedRecipeStates, setSavedRecipeStates] = useState< Record<string, boolean> >({});

  const handleSavedRecipeChange = useCallback(
    (recipeId: string, saved: boolean) => {
      setSavedRecipeStates((states) => ({
        ...states,
        [recipeId]: saved,
      }));
      setSavedRecipesVersion((version) => version + 1);
    },
    []
  );

  useEffect(() => {
    if (currentUser.userType === "VISITOR" || !currentUser.id) {
      router.replace("/");
      return;
    }

    if (currentUser.userType === "MODERATOR") {
      router.replace("/moderator");
    }
  }, [currentUser.id, currentUser.userType, router]);

  if (currentUser.userType !== "CLIENT" || !currentUser.id) {
    return null;
  }

  return (
    <main className="flex min-h-screen bg-vegr-cream text-vegr-ink">
      <NavigationMenu />

      <div className="min-w-0 flex-1 px-6 py-10 md:px-12 lg:px-16">
        <ProfileDetails />
        <SavedRecipesProfile
          refreshKey={savedRecipesVersion}
          savedRecipeStates={savedRecipeStates}
          onSavedChange={handleSavedRecipeChange} />
        <MyRecipesProfile
          savedRecipeStates={savedRecipeStates}
          onSavedChange={handleSavedRecipeChange} />
      </div>
    </main>
  );
}
