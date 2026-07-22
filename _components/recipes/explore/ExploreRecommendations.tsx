import RecommendationRow, { type RecommendationRowData } from "@/_components/recipes/explore/RecommendationRow";
import ExploreLoadingRows from "@/_components/recipes/explore/ExploreLoadingRows";

export default function ExploreRecommendations({ 
    rows,
    savedStates,
    actionsMode,
    isLoading,
    onSavedChange,
} : {
    rows: RecommendationRowData[];
    savedStates: Record<string, boolean>;
    actionsMode: "full" | "readonly";
    isLoading: boolean;
    onSavedChange: (recipeId: string, saved: boolean) => void;
}) {
    if (isLoading) return <ExploreLoadingRows />;

    if (rows.length === 0) {
    return (
        <p className="mt-10 text-zinc-600">
            No approved recipes are ready for Explore yet.
        </p>
    );
    }

    return (
    <div className="mt-10 space-y-16">
        {rows.map((row) => (
        <RecommendationRow
            key={row.id}
            row={row}
            savedStates={savedStates}
            actionsMode={actionsMode}
            onSavedChange={onSavedChange}
        />
        ))}
    </div>
    );
}