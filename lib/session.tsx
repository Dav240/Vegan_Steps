"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type UserType = "VISITOR" | "CLIENT" | "MODERATOR";

export type CurrentUser = {
  id: string | null;
  username: string;
  email: string;
  userType: UserType;
};

type SessionContextType = {
  currentUser: CurrentUser;
  isSessionLoading: boolean;
  setCurrentUser: (user: CurrentUser) => void;
};

const visitorUser: CurrentUser = {
  id: null,
  username: "Visitor",
  email: "",
  userType: "VISITOR",
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(visitorUser);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    fetch("/api/session", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load your session.");
        }

        return data.user as CurrentUser;
      })
      .then((user) => {
        if (isActive) {
          setCurrentUserState({ ...visitorUser, ...user });
        }
      })
      .catch(() => {
        if (isActive) {
          setCurrentUserState(visitorUser);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsSessionLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const setCurrentUser = useCallback((user: CurrentUser) => {
    setCurrentUserState(user);
    setIsSessionLoading(false);
  }, []);

  return (
    <SessionContext.Provider value={{ currentUser, isSessionLoading, setCurrentUser }}>
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
