import { type RecipeViewData } from "@/_components/recipes/viewing/RecipeView";
import { Button } from "@/_components/ui/button";
import { Ban, ChevronLeft, ChevronRight, ShieldCheck, Trash2 } from "lucide-react";

export default function ModeratorReviewPanel({ 
    recipe,
    reportIndex,
    onReportIndexChange,
    denyReason,
    onDenyReasonChange,
    isPending,
    error,
    notice,
    onApprove,
    onDeny,
    onIgnoreReports,
    onDeleteRecipe,
    onDeleteRecipeAndBanUser,
} : {
    recipe: RecipeViewData;
    reportIndex: number;
    onReportIndexChange: (index: number) => void;
    denyReason: string;
    onDenyReasonChange: (reason: string) => void;
    isPending: boolean;
    error: string;
    notice: string;
    onApprove: () => void;
    onDeny: () => void;
    onIgnoreReports: () => void;
    onDeleteRecipe: () => void;
    onDeleteRecipeAndBanUser: () => void;
}) {
    const currentReport = recipe.reports[reportIndex] ?? null;
    const reportCount = recipe.reports.length;

    function moveReport(direction: -1 | 1) {
        if (reportCount === 0) return;
        onReportIndexChange((reportIndex + direction + reportCount) % reportCount);
    }

    return (
        <section className="mt-10 space-y-6">
        {recipe.status === "PENDING" && (
            <div className="rounded-lg border border-brand-green/25 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase text-brand-green-dark">
                Submitted recipe review
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" onClick={onApprove} disabled={isPending} className="bg-brand-green text-white hover:bg-brand-green-dark">
                    <ShieldCheck />
                    Approve
                </Button>
            </div>
            <label htmlFor="deny-reason" className="mt-5 block text-sm font-bold uppercase text-brand-berry-dark">
                Deny reason
            </label>
            <textarea id="deny-reason" value={denyReason} onChange={(event) => onDenyReasonChange(event.target.value)} rows={4}
                className="mt-2 w-full resize-y rounded-md border border-brand-berry-soft bg-brand-cream px-3 py-2 text-sm outline-none focus:border-brand-berry focus:ring-2 focus:ring-brand-berry-soft"
                placeholder="Explain what needs to change."
            />
            <Button type="button" onClick={onDeny} disabled={isPending} className="mt-3 bg-deep-crimson-600 text-white hover:bg-deep-crimson-700">
                Deny
            </Button>
            </div>
        )}

        {reportCount > 0 && (
            <div className="rounded-lg border border-brand-berry-soft bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                    <h2 className="text-sm font-bold uppercase text-brand-berry-dark">
                        Reports
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                        {reportIndex + 1}/{reportCount}
                    </p>
                    </div>
                    <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => moveReport(-1)}
                        aria-label="Previous report"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => moveReport(1)}
                        aria-label="Next report"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    </div>
                </div>

                {currentReport && (
                    <article className="mt-4 rounded-md border border-brand-green/20 bg-brand-cream p-4">
                        <div className="flex flex-wrap justify-between gap-2">
                            <h3 className="font-bold text-brand-ink">
                                {currentReport.title}
                            </h3>
                            <span className="text-xs font-semibold text-zinc-600">
                                {formatDateTime(currentReport.createdAt)}
                            </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-brand-berry-dark">
                            {formatEnum(currentReport.reason)} by{" "}
                            {currentReport.reporterUsername}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                            {currentReport.details || "No additional details were provided."}
                        </p>
                    </article>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={onIgnoreReports} disabled={isPending}
                    className="border-brand-green text-brand-green-dark hover:bg-brand-green-soft"
                    >
                        Ignore Recipe
                    </Button>
                    <Button type="button" onClick={onDeleteRecipe} disabled={isPending} className="bg-deep-crimson-600 text-white hover:bg-deep-crimson-700">
                        <Trash2 />
                        Delete Recipe
                    </Button>
                    <Button type="button" onClick={onDeleteRecipeAndBanUser} disabled={isPending} className="bg-brand-berry text-white hover:bg-brand-berry-dark">
                        <Ban />
                        Delete Recipe & Ban User
                    </Button>
                </div>
            </div>
        )}

        {(error || notice) && (
            <p
            className={
                error ? "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                : "rounded-md border border-brand-green/25 bg-brand-green-soft px-4 py-3 text-sm font-semibold text-brand-green-dark"
            }
            >
            {error || notice}
            </p>
        )}
        </section>
    );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}