"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";

import { Button } from "@/_components/ui/button";

const PAGE_SIZE = 20;

type ReportEntry = {
  recipeId: string;
  recipeName: string;
  reportCount: number;
  status: string;
  mostRecentReportAt: string | null;
};

type ReportsResponse = {
  entries: ReportEntry[];
  hasMore: boolean;
  total: number;
  error?: string;
};

export default function SubmittedReportsTab() {
  const router = useRouter();
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async (offset: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(PAGE_SIZE),
    });
    const response = await fetch(`/api/moderator/reports?${params.toString()}`, {
      signal,
    });
    const data = (await response.json()) as ReportsResponse;

    if (!response.ok) {
      throw new Error(data.error || "Could not load reports.");
    }

    return data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchReports(0, controller.signal)
      .then((data) => {
        setEntries(data.entries);
        setHasMore(data.hasMore);
        setTotal(data.total);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== "AbortError") {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [fetchReports]);

  async function loadMore() {
    setIsLoadingMore(true);
    setError("");

    try {
      const data = await fetchReports(entries.length);
      setEntries((current) => [...current, ...data.entries]);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load more reports."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <section className="p-5">
      {error && <p className="mb-4 text-sm font-semibold text-red-700">{error}</p>}
      {isLoading ? (
        <ModerationTableLoading />
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-brand-berry-soft">
            <div className="grid grid-cols-[190px_minmax(0,1fr)_140px_160px] bg-brand-green-soft px-4 py-3 text-sm font-bold uppercase text-brand-berry-dark">
              <span>Recent report</span>
              <span>Recipe name</span>
              <span>Reports</span>
              <span>Status</span>
            </div>
            {entries.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-600">
                No active reports.
              </p>
            ) : (
              entries.map((entry) => (
                <button key={`${entry.recipeId}-${entry.status}`} type="button"
                  onClick={() =>
                    router.push(`/recipes?recipeId=${encodeURIComponent(entry.recipeId)}`)
                  }
                  className="group grid w-full grid-cols-[190px_minmax(0,1fr)_140px_160px] border-t border-brand-berry-soft px-4 py-3 text-left text-sm transition-colors hover:bg-brand-green-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green"
                >
                  <span className="font-semibold text-zinc-700 transition-colors group-hover:text-brand-green-dark">
                    {entry.mostRecentReportAt ? formatDateTime(entry.mostRecentReportAt) : "Unknown"}
                  </span>
                  <span className="truncate font-bold text-brand-ink transition-colors group-hover:text-brand-green-dark">
                    {entry.recipeName || "Untitled recipe"}
                  </span>
                  <span className="transition-colors group-hover:text-brand-green-dark">
                    {entry.reportCount}
                  </span>
                  <span className="transition-colors group-hover:text-brand-green-dark">
                    {formatEnum(entry.status)}
                  </span>
                </button>
              ))
            )}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={isLoadingMore}
                className="border-brand-green bg-white text-brand-green-dark hover:bg-brand-green-soft"
              >
                <ArrowDown className={isLoadingMore ? "animate-bounce" : ""} />
                {isLoadingMore ? "Loading..." : `Load ${Math.min(PAGE_SIZE, total - entries.length)} more`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ModerationTableLoading() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-11 animate-pulse rounded bg-brand-green-soft" />
      ))}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEnum(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
