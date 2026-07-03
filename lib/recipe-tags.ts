import {
  formatRecipeEnum,
  RECIPE_TAGS,
  type RecipeTag,
} from "@/lib/recipe-draft";

export type RecipeTagCategoryId = | "allergies" | "taste" | "meal_type" | "cultural_background";

export type RecipeTagCategory = {
  id: RecipeTagCategoryId;
  label: string;
  tags: readonly RecipeTag[];
};

const RECIPE_TAG_LABELS: Partial<Record<RecipeTag, string>> = {
  CARRIBEAN: "Caribbean",
  EAST_AND_WEST_AFRICAN: "East & West African",
};

export const RECIPE_TAG_CATEGORIES = [
  {
    id: "allergies",
    label: "Allergies",
    tags: ["GLUTEN_FREE", "GLUTEN", "CONTAINS_NUTS", "CONTAINS_SOY"],
  },
  {
    id: "taste",
    label: "Taste",
    tags: [
      "PROTEIN_RICH",
      "SAVOURY",
      "SWEET",
      "UMAMI",
      "SPICY",
      "CREAMY",
      "CRISPY",
      "BITTER",
      "SOUR",
    ],
  },
  {
    id: "meal_type",
    label: "Meal Type",
    tags: [
      "SNACK",
      "PARTY_MEAL",
      "BREAKFAST",
      "MEAL_PREP",
      "SALAD",
      "SIDE_DISH",
      "DESSERT",
    ],
  },
  {
    id: "cultural_background",
    label: "Cultural Background",
    tags: [
      "MEXICAN",
      "SOUTH_AMERICAN",
      "CARRIBEAN",
      "ITALIAN",
      "FRENCH",
      "MEDITERRANEAN",
      "INDIAN",
      "CHINESE",
      "JAPANESE",
      "KOREAN",
      "SOUTHEAST_ASIAN",
      "MIDDLE_EASTERN",
      "PERSIAN",
      "NORTH_AFRICAN",
      "EAST_AND_WEST_AFRICAN",
    ],
  },
] as const satisfies readonly RecipeTagCategory[];

export function getRecipeTagLabel(tag: RecipeTag) {
  return RECIPE_TAG_LABELS[tag] ?? formatRecipeEnum(tag);
}

export function searchRecipeTags(tags: readonly RecipeTag[], query: string) {
  const words = normalizeTagSearch(query).split(" ").filter(Boolean);

  if (words.length === 0) {
    return [...tags];
  }

  return tags.filter((tag) => {
    const searchableLabel = normalizeTagSearch(getRecipeTagLabel(tag));
    const searchableValue = normalizeTagSearch(tag);

    return words.every(
      (word) =>
        searchableLabel.includes(word) || searchableValue.includes(word)
    );
  });
}

export function getUncategorizedRecipeTags() {
  const categorizedTags = new Set(
    RECIPE_TAG_CATEGORIES.flatMap((category) => category.tags)
  );

  return RECIPE_TAGS.filter((tag) => !categorizedTags.has(tag));
}

export function getRecipeTagCategories() {
  const uncategorizedTags = getUncategorizedRecipeTags();

  return RECIPE_TAG_CATEGORIES.map((category) => ({
    ...category,
    tags:
      category.id === "taste" ? [...category.tags, ...uncategorizedTags] : [...category.tags],
  }));
}

function normalizeTagSearch(value: string) {
  return value.replaceAll("_", " ").trim().toLocaleLowerCase();
}
