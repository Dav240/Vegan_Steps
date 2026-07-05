"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileWarning, LogOut, ScrollText } from "lucide-react";

import SubmittedReportsTab from "@/_components/moderator/submitted_reports/SubmittedReportsTab";
import SubmittedRecipesTab from "@/_components/moderator/submitted_recipes/SubmittedRecipesTab";
import { Button } from "@/_components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type ModeratorTab = "reports" | "submitted";

const visitorUser = {
  id: null,
  username: "Visitor",
  email: "",
  userType: "VISITOR" as const,
};

export default function ModeratorPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useSession();
  const [activeTab, setActiveTab] = useState<ModeratorTab>("reports");

  useEffect(() => {
    if (currentUser.userType === "VISITOR") {
      router.replace("/");
      return;
    }

    if (currentUser.userType !== "MODERATOR") {
      router.replace("/profile");
    }
  }, [currentUser.userType, router]);

  function logout() {
    setCurrentUser(visitorUser);
    router.replace("/");
  }

  if (currentUser.userType !== "MODERATOR" || !currentUser.id) {
    return null;
  }

  return (
    <main className="min-h-screen bg-vegr-cream px-6 py-8 text-vegr-ink md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-vegr-green-dark">
              Moderator
            </p>
            <h1 className="mt-1 text-4xl font-bold text-vegr-ink">
              Moderator Home
            </h1>
          </div>
          <Button
            type="button"
            onClick={logout}
            className="bg-vegr-berry text-white hover:bg-vegr-berry-dark"
          >
            <LogOut />
            Logout
          </Button>
        </header>

        <div className="mt-8 overflow-hidden rounded-lg border border-vegr-berry-soft bg-white shadow-sm">
          <div className="grid grid-cols-2 border-b border-vegr-berry-soft bg-vegr-berry-soft">
            <ModeratorTabButton
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
              icon={<FileWarning className="size-5" />}
            >
              Reports
            </ModeratorTabButton>
            <ModeratorTabButton
              active={activeTab === "submitted"}
              onClick={() => setActiveTab("submitted")}
              icon={<ScrollText className="size-5" />}
            >
              Submitted Recipes
            </ModeratorTabButton>
          </div>

          {activeTab === "reports" ? (
            <SubmittedReportsTab moderatorId={currentUser.id} />
          ) : (
            <SubmittedRecipesTab moderatorId={currentUser.id} />
          )}
        </div>
      </div>
    </main>
  );
}

function ModeratorTabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-16 items-center justify-center gap-2 border-b-4 px-4 text-base font-bold transition-colors",
        active
          ? "border-vegr-green bg-white text-vegr-green-dark"
          : "border-transparent text-vegr-berry-dark hover:bg-white/80 hover:text-vegr-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vegr-green"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
