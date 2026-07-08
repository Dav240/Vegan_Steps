"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/_components/ui/button";
import { Switch } from "@/_components/ui/switch";
import {
  defaultPrivacyPreferences,
  type PrivacyPreferences,
} from "@/lib/legal";

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

    window.addEventListener(
      "vegr-optional-data-deleted",
      handleOptionalDataDeleted
    );

    fetch("/api/profile/preferences", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

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
        setPreferences(data.preferences);
        setStorageReady(data.storageReady);
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
        "vegr-optional-data-deleted",
        handleOptionalDataDeleted
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save privacy preferences.");
      }

      setStorageReady(data.storageReady);
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
    <section className="mt-8 max-w-2xl rounded-lg border border-vegr-berry-soft bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-vegr-berry">
            Privacy choices
          </p>
          <h2 className="mt-1 text-2xl font-bold text-vegr-ink">
            Optional data
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-700">
            Core account data is needed for VegR to work. These settings control
            the extra bits you can say no to.
          </p>
        </div>
        <Link
          href="/legal#privacy"
          className="text-sm font-bold text-vegr-berry hover:text-vegr-berry-dark hover:underline"
        >
          Privacy Policy
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        <PreferenceRow
          title="Personalised recommendations"
          description="Use your recipe views, saves, and ratings to tune Explore."
          checked={preferences.personalisedRecommendations}
          disabled={isLoading}
          onCheckedChange={(checked) =>
            setPreferences((current) => ({
              ...current,
              personalisedRecommendations: checked,
            }))
          }
        />
        <PreferenceRow
          title="Analytics"
          description="Help measure page usage and spot awkward flows."
          checked={preferences.analytics}
          disabled={isLoading}
          onCheckedChange={(checked) =>
            setPreferences((current) => ({ ...current, analytics: checked }))
          }
        />
        <PreferenceRow
          title="Product emails"
          description="Optional product updates. Security and reset emails still work."
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
            storageReady
              ? "bg-vegr-green-soft text-vegr-green-dark"
              : "bg-vegr-gold-soft text-vegr-berry-dark"
          }`}
        >
          {message}
        </p>
      )}

      <Button
        type="button"
        onClick={() => void savePreferences()}
        disabled={isSaving || isLoading}
        className="mt-5 bg-vegr-green text-white hover:bg-vegr-green-dark"
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

function PreferenceRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-vegr-green-soft bg-vegr-cream p-3">
      <span>
        <span className="block font-bold text-vegr-ink">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-zinc-600">
          {description}
        </span>
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}
