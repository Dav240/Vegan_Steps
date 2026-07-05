"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/session";
import VisitorHome from "@/_components/home/VisitorHome";

export default function HomeRouter() {
  const router = useRouter();
  const { currentUser } = useSession();

  useEffect(() => {
    if (currentUser.userType !== "VISITOR") {
      router.replace(currentUser.userType === "MODERATOR" ? "/moderator" : "/profile");
    }
  }, [currentUser.userType, router]);

  if (currentUser.userType !== "VISITOR") {
    return null;
  }

  return <VisitorHome />;
}
