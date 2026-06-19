"use client";

import Link from "next/link";
import { ChevronDown, LogOut, User, UserRound } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/session";

export default function ProfileHeader() {
  const { currentUser, setCurrentUser } = useSession();

  function handleLogout() {
    setCurrentUser({
      id: null,
      username: "Visitor",
      userType: "VISITOR",
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex h-20 items-center gap-3 px-5 font-indie-flower text-2xl text-crimson-violet-100 outline-none transition-colors hover:bg-crimson-violet-800 hover:text-white focus-visible:bg-crimson-violet-800 focus-visible:text-white">
          <span className="flex size-10 items-center justify-center rounded-full border border-crimson-violet-500 bg-crimson-violet-900 text-crimson-violet-100">
            <UserRound className="size-5" />
          </span>
          <span>
            {currentUser.username}
          </span>
          <ChevronDown className="size-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
