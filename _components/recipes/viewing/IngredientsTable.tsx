import { type RecipeIngredient } from "@/_components/recipes/viewing/RecipeView";
export default function IngredientsTable({ 
    servings,
    ingredients,
} : {
    servings: number;
    ingredients: RecipeIngredient[];
}) {
    return (
        <section className="mt-16" aria-labelledby="ingredients-heading">
            <div className="overflow-hidden rounded-lg border border-brand-berry-soft bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-brand-green/20 bg-brand-green-soft px-5 py-4">
                    <h2 id="ingredients-heading" className="font-indie-flower text-3xl font-bold text-brand-ink">
                        Ingredients
                    </h2>
                    <span className="shrink-0 text-sm font-bold text-brand-berry-dark">
                        Servings: {servings}
                    </span>
                </div>

                <table className="w-full border-collapse">
                    <thead className="sr-only">
                    <tr>
                        <th scope="col">Amount</th>
                        <th scope="col">Ingredient</th>
                    </tr>
                    </thead>
                    <tbody>
                        {ingredients.length > 0 ? (
                            ingredients.map((ingredient) => (
                            <tr
                                key={ingredient.id}
                                className="border-b border-brand-green/15 last:border-b-0"
                            >
                                <td className="w-32 px-5 py-3.5 align-top font-semibold text-brand-green-dark">
                                    {formatIngredientAmount(ingredient)}
                                </td>
                                <td className="px-5 py-3.5 text-brand-ink">
                                    {ingredient.name}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="px-5 py-6 text-sm text-zinc-600">
                                    No ingredients have been added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

const unitLabels: Record<string, string> = {
    GRAM: "g",
    KILOGRAM: "kg",
    MILLILITRE: "ml",
    LITRE: "l",
    TEASPOON: "tsp",
    TABLESPOON: "tbsp",
    CUP: "cup",
    PIECE: "piece",
    PINCH: "pinch",
    POUNDS: "lb",
    OUNCES: "oz",
    NONE: ""
};

function formatIngredientAmount(ingredient: RecipeIngredient) {
    const quantity = ingredient.quantity == null ? "" : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(ingredient.quantity);
    const unit = ingredient.unit ? unitLabels[ingredient.unit] ?? ingredient.unit : "";

    return [quantity, unit].filter(Boolean).join(" ") || "To taste";
}