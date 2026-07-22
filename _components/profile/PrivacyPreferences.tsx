"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/_components/ui/button";
import { defaultPrivacyPreferences, type PrivacyPreferences } from "@/lib/legal";

import PreferenceRow from "@/_components/legal/PreferenceRow";

export default function PrivacyPreferences() {
  const [preferences, setPreferences] = useState<PrivacyPreferences>(
    defaultPrivacyPreferences
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [storageReady, setStorageReady] = useState(true);

  useEffect(() => {
    let isActive = true;
    function handleOptionalDataDeleted() {
      setPreferences(defaultPrivacyPreferences);
      setMessage("Optional data deleted and optional preferences turned off.");
      setStorageReady(true);
    }

    function handleCookiePreferencesSaved(event: Event) {
      const preferencesEvent = event as CustomEvent<PrivacyPreferences>;

      if (!preferencesEvent.detail) {
        return;
      }

      setPreferences(preferencesEvent.detail);
      setMessage("Privacy choices updated from your cookie preferences.");
      setStorageReady(true);
    }

    window.addEventListener(
      "brand-optional-data-deleted",
      handleOptionalDataDeleted
    );
    window.addEventListener(
      "brand-cookie-preferences-saved",
      handleCookiePreferencesSaved
    );

    fetch("/api/profile/preferences", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.error || "Could not load privacy preferences.");
        }

        return data as {
          preferences: PrivacyPreferences;
          storageReady: boolean;
          message?: string;
        };
      })
      .then((data) => {
        if (!isActive) return;
        setPreferences(data.preferences ?? defaultPrivacyPreferences);
        setStorageReady(data.storageReady ?? false);
        setMessage(data.message ?? "");
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load privacy preferences."
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      window.removeEventListener(
        "brand-optional-data-deleted",
        handleOptionalDataDeleted
      );
      window.removeEventListener(
        "brand-cookie-preferences-saved",
        handleCookiePreferencesSaved
      );
    };
  }, []);

  async function savePreferences() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not save privacy preferences.");
      }

      setStorageReady(data.storageReady ?? true);
      setMessage(data.message || "Privacy preferences saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save privacy preferences."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-berry">
            Privacy choices
          </p>
          <h2 className="mt-1 text-2xl font-bold text-brand-ink">
            Optional data
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Core account data is needed for Vegan Steps to work. These settings control
            the extra bits you can say no to.
          </p>
        </div>
        <Link
          href="/legal#privacy"
          className="text-sm font-bold text-brand-berry hover:text-brand-berry-dark hover:underline"
        >
          FAQ
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        <PreferenceRow title="Personalised recommendations" description="Use your recipe views, saves, and ratings to tune Explore."
          checked={preferences.personalisedRecommendations}
          disabled={isLoading}
          onCheckedChange={(checked) =>
            setPreferences((current) => ({
              ...current,
              personalisedRecommendations: checked,
            }))
          }
        />
        <PreferenceRow title="Analytics" description="Help measure page usage and spot awkward flows."
          checked={preferences.analytics}
          disabled={isLoading}
          onCheckedChange={(checked) =>
            setPreferences((current) => ({ ...current, analytics: checked }))
          }
        />
        <PreferenceRow title="Product emails" description="Optional product updates. Security and reset emails still work."
          checked={preferences.productEmails}
          disabled={isLoading}
          onCheckedChange={(checked) =>
            setPreferences((current) => ({
              ...current,
              productEmails: checked,
            }))
          }
        />
      </div>

      {message && (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm font-medium ${
            storageReady ? "bg-brand-green-soft text-brand-green-dark" : "bg-brand-gold-soft text-brand-berry-dark"}`
          }
        >
          {message}
        </p>
      )}

      <Button type="button" onClick={() => void savePreferences()} disabled={isSaving || isLoading} 
        className="mt-5 bg-brand-green text-white hover:bg-brand-green-dark"
      >
        {isSaving ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Save privacy choices
      </Button>
    </section>
  );
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      error: `Expected JSON but received ${response.status} ${response.statusText}. Check the server terminal for the API error.`,
    };
  }

  return (await response.json()) as {
    error?: string;
    message?: string;
    preferences?: PrivacyPreferences;
    storageReady?: boolean;
  };
}

