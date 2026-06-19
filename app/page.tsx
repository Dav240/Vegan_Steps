"use client";

import { useSession } from "@/lib/session"
import VisitorHome from "@/components/home/VisitorHome";
import ModHome from "@/components/home/ModHome";

export default function HomeRouter() {
  const { currentUser } = useSession();

  if (currentUser.userType === "MODERATOR") {
    return <ModHome />;
  }

  return <VisitorHome />;
}