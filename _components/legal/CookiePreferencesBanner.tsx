"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/_components/ui/button";
import { defaultPrivacyPreferences, type PrivacyPreferences } from "@/lib/legal";
import { useSession } from "@/lib/session";

import PreferenceToggle from "@/_components/legal/PreferenceToggle";

const COOKIE_NAME = "vegansteps_cookie_preferences";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export default function CookiePreferencesBanner() {
  const { currentUser } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<PrivacyPreferences>(
    defaultPrivacyPreferences
  );

  useEffect(() => {
    queueMicrotask(() => {
      const storedPreferences = readCookiePreferences();
      setIsOpen(!storedPreferences);
      setPreferences(storedPreferences ?? defaultPrivacyPreferences);
      setIsReady(true);
    });
  }, []);

  if (!isReady || !isOpen) {
    return null;
  }

  function savePreferences(nextPreferences: PrivacyPreferences) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(nextPreferences))}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
    setPreferences(nextPreferences);
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent("brand-cookie-preferences-saved", {
        detail: nextPreferences,
      })
    );

    if (currentUser.id && currentUser.userType !== "VISITOR") {
      void syncProfilePreferences(nextPreferences);
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-lg border border-brand-berry-soft bg-brand-paper p-4 text-brand-ink shadow-2xl md:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-berry">
            Cookie preferences
          </p>
          <h2 className="mt-1 text-xl font-bold">Choose how Vegan Steps learns.</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Essential cookies keep login and security working. Optional analytics and visitor recommendations stay off unless you allow them.
          </p>
          <Link href="/legal#cookies" className="mt-2 inline-flex text-sm font-bold text-brand-berry hover:text-brand-berry-dark hover:underline">
            Read the FAQ
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button type="button" variant="outline" onClick={() => savePreferences(defaultPrivacyPreferences)}
            className="border-brand-berry bg-white text-brand-berry hover:bg-brand-berry-soft"
          >
            Reject optional
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowDetails((current) => !current)}
            className="border-brand-green bg-white text-brand-green-dark hover:bg-brand-green-soft"
          >
            Manage
          </Button>
          <Button type="button" onClick={() => savePreferences({ personalisedRecommendations: true, analytics: true, productEmails: false })}
            className="bg-brand-green text-white hover:bg-brand-green-dark"
          >
            Accept optional
          </Button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 grid gap-3 border-t border-brand-berry-soft pt-4 md:grid-cols-3">
          <PreferenceToggle label="Visitor recommendations" description="Use browsing signals to improve recipe suggestions before login."
            checked={preferences.personalisedRecommendations}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({
                ...current,
                personalisedRecommendations: checked,
              }))
            }
          />
          <PreferenceToggle label="Analytics" description="Help measure which pages and flows are working." checked={preferences.analytics}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({ ...current, analytics: checked }))
            }
          />
          <PreferenceToggle label="Product emails" description="Optional announcements later; not used for security emails." checked={preferences.productEmails}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({
                ...current,
                productEmails: checked,
              }))
            }
          />
          <div className="md:col-span-3">
            <Button type="button" onClick={() => savePreferences(preferences)} className="bg-brand-berry text-white hover:bg-brand-berry-dark">
              Save preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

async function syncProfilePreferences(preferences: PrivacyPreferences) {
  try {
    await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
  } catch (error) {
    console.error(error);
  }
}

function readCookiePreferences() {
  const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("="))) as PrivacyPreferences;
  } catch {
    return defaultPrivacyPreferences;
  }
}
