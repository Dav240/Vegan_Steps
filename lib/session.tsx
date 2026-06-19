"use client";

import { createContext, useContext, useEffect, useState } from "react";

type UserType = "VISITOR" | "CLIENT" | "MODERATOR";

export type CurrentUser = {
  id: string | null;
  username: string;
  userType: UserType;
};

type SessionContextType = {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
};

const visitorUser: CurrentUser = {
  id: null,
  username: "Visitor",
  userType: "VISITOR",
};

const SessionContext = createContext<SessionContextType | null>(null);

function getStoredUser() {
  if (typeof window === "undefined") {
    return visitorUser;
  }

  const storedUser = sessionStorage.getItem("currentUser");

  if (!storedUser) {
    sessionStorage.setItem("currentUser", JSON.stringify(visitorUser));
    return visitorUser;
  }

  try {
    return JSON.parse(storedUser) as CurrentUser;
  } catch {
    sessionStorage.setItem("currentUser", JSON.stringify(visitorUser));
    return visitorUser;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(getStoredUser);

  useEffect(() => {
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  function setCurrentUser(user: CurrentUser) {
    setCurrentUserState(user);
  }

  return (
    <SessionContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
