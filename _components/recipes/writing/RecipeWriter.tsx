"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, Send, Trash2, X } from "lucide-react";

import NavigationMenu from "@/_components/NavigationMenu";
import IngredientsEditor, { emptyIngredient, type IngredientRow } from "@/_components/recipes/writing/IngredientsEditor";
import InstructionsEditor, { emptyInstruction, type InstructionRow } from "@/_components/recipes/writing/InstructionsEditor";
import RecipeTagPicker from "@/_components/recipes/writing/RecipeTagPicker";
import { Button } from "@/_components/ui/button";
import RecipeImagePlaceholder from "@/_components/ui/RecipeImagePlaceholder";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import {
  formatRecipeEnum,
  MAX_RECIPE_IMAGE_BYTES,
  MAX_RECIPE_INGREDIENTS,
  MAX_RECIPE_STEPS,
  MAX_RECIPE_TAGS,
  type RecipeDraft,
  type RecipeTag,
} from "@/lib/recipe-draft";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type EditorDraft = Omit<RecipeDraft, "ingredients" | "stepsPrep" | "stepsCook"> & {
  ingredients: IngredientRow[];
  stepsPrep: InstructionRow[];
  stepsCook: InstructionRow[];
};

export default function RecipeWriter({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const { currentUser } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowCounter = useRef(0);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  function nextRowId(prefix: string) {
    rowCounter.current += 1;
    return `${prefix}-${rowCounter.current}`;
  }

  useEffect(() => {
    if (!currentUser.id || currentUser.userType === "VISITOR") {
      router.replace("/");
      return;
    }

    if (currentUser.userType === "MODERATOR") {
      router.replace("/moderator");
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      userId: currentUser.id,
      recipeId,
    });

    fetch(`/api/recipes/drafts?${params.toString()}`, {
      signal: controller.signal,
    }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load the recipe draft.");
        }
        return data.recipe as RecipeDraft;
      }).then((recipe) => {
        setDraft({
          ...recipe,
          ingredients:
            recipe.ingredients.length > 0
              ? recipe.ingredients.map((ingredient) => ({
                  ...ingredient,
                  rowId: nextRowId("ingredient"),
                }))
              : [emptyIngredient(nextRowId("ingredient"))],
          stepsPrep:
            recipe.stepsPrep.length > 0
              ? recipe.stepsPrep.map((step) => ({
                  rowId: nextRowId("prep"),
                  text: step.text,
                }))
              : [emptyInstruction(nextRowId("prep"))],
          stepsCook:
            recipe.stepsCook.length > 0
              ? recipe.stepsCook.map((step) => ({
                  rowId: nextRowId("cook"),
                  text: step.text,
                }))
              : [emptyInstruction(nextRowId("cook"))],
        });
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
  }, [currentUser.id, currentUser.userType, recipeId, router]);

  function updateDraft<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setNotice("");
  }

  function updateIngredient(rowId: string, patch: Partial<IngredientRow>) {
    if (!draft) return;
    updateDraft(
      "ingredients",
      draft.ingredients.map((ingredient) =>
        ingredient.rowId === rowId ? { ...ingredient, ...patch } : ingredient
      )
    );
  }

  function addIngredient() {
    if (!draft || draft.ingredients.length >= MAX_RECIPE_INGREDIENTS) return;
    updateDraft("ingredients", [
      ...draft.ingredients,
      emptyIngredient(nextRowId("ingredient")),
    ]);
  }

  function removeIngredient(rowId: string) {
    if (!draft) return;
    const remaining = draft.ingredients.filter((ingredient) => ingredient.rowId !== rowId);
    updateDraft(
      "ingredients",
      remaining.length > 0
        ? remaining
        : [emptyIngredient(nextRowId("ingredient"))]
    );
  }

  function updateInstruction(
    section: "stepsPrep" | "stepsCook",
    rowId: string,
    text: string
  ) {
    if (!draft) return;
    updateDraft(
      section,
      draft[section].map((step) =>
        step.rowId === rowId ? { ...step, text } : step
      )
    );
  }

  function addInstruction(section: "stepsPrep" | "stepsCook") {
    if (!draft || draft[section].length >= MAX_RECIPE_STEPS) return;
    const prefix = section === "stepsPrep" ? "prep" : "cook";
    updateDraft(section, [
      ...draft[section],
      emptyInstruction(nextRowId(prefix)),
    ]);
  }

  function removeInstruction(section: "stepsPrep" | "stepsCook", rowId: string) {
    if (!draft) return;
    const remaining = draft[section].filter((step) => step.rowId !== rowId);
    const prefix = section === "stepsPrep" ? "prep" : "cook";
    updateDraft(
      section,
      remaining.length > 0
        ? remaining
        : [emptyInstruction(nextRowId(prefix))]
    );
  }

  function addTag(tag: RecipeTag) {
    if (!draft) return;
    if (draft.tags.includes(tag) || draft.tags.length >= MAX_RECIPE_TAGS) return;
    updateDraft("tags", [...draft.tags, tag]);
  }

  function removeTag(tag: RecipeTag) {
    if (!draft) return;
    updateDraft(
      "tags",
      draft.tags.filter((currentTag) => currentTag !== tag)
    );
  }

  async function uploadImage(file: File) {
    if (!draft || !currentUser.id) return;

    if (file.size > MAX_RECIPE_IMAGE_BYTES) {
      setError("Recipe images must be 5 MB or smaller.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }

    setIsUploading(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.set("userId", currentUser.id);
      formData.set("recipeId", recipeId);
      formData.set("file", file);

      const response = await fetch("/api/recipes/images", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not upload the recipe image.");
      }

      setDraft((current) =>
        current ? { ...current, imageUrl: data.imageUrl, imageKey: data.imageKey } : current
      );
      setNotice("Image uploaded.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Could not upload the recipe image."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveDraft(action: "save" | "submit") {
    if (!draft || !currentUser.id || isSaving) return false;

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/recipes/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          recipeId,
          action,
          draft,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the recipe draft.");
      }

      if (action === "submit") {
        router.replace(`/recipes?recipeId=${encodeURIComponent(recipeId)}`);
      } else {
        setNotice("Draft saved.");
      }
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the recipe draft."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteDraft() {
    if (!currentUser.id || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/recipes/drafts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, recipeId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the recipe draft.");
      }

      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace("/profile");
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the recipe draft."
      );
      setDeleteDialogOpen(false);
      setIsSaving(false);
    }
  }

  if (!currentUser.id || currentUser.userType !== "CLIENT") {
    return null;
  }

  const ingredientsAreExpanded =
    draft !== null && draft.ingredients.length > 10;

  return (
    <main className="flex min-h-screen bg-vegr-cream text-vegr-ink">
      <NavigationMenu />

      <div className="min-w-0 flex-1">
        {isLoading ? (
          <RecipeWriterLoading />
        ) : error && !draft ? (
          <p className="px-6 py-16 font-medium text-red-700 md:px-12 lg:px-16">
            {error}
          </p>
        ) : draft ? (
          <div className="mx-auto w-full max-w-[1500px] px-6 py-10 md:px-12 lg:px-16">
            <div className="grid items-start gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:gap-x-16">
              <section className="min-w-0">
                <p className="text-sm font-semibold uppercase text-vegr-berry">
                  Recipe draft
                </p>
                <Label htmlFor="recipe-title" className="sr-only">
                  Recipe title
                </Label>
                <Input id="recipe-title" value={draft.name} 
                  onChange={(event) => updateDraft("name", event.target.value)}
                  placeholder="Recipe title"
                  className="mt-2 h-auto border-0 bg-transparent px-0 py-1 text-4xl font-bold shadow-none focus-visible:ring-0 md:text-5xl"
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  <NumberField id="prep-time" label="Prep" value={draft.prepTimeMinutes} min={0} suffix="min"
                    onChange={(value) => updateDraft("prepTimeMinutes", value)}
                  />
                  <NumberField id="cook-time" label="Cook" value={draft.cookTimeMinutes} min={0} suffix="min"
                    onChange={(value) => updateDraft("cookTimeMinutes", value)}
                  />
                </div>
                {draft.rejectionReason && (
                  <div className="mt-6 rounded-lg border border-vegr-berry-soft bg-vegr-berry-soft/50 px-4 py-3 shadow-sm">
                    <p className="text-xs font-bold uppercase text-vegr-berry-dark">
                      Moderator comment
                    </p>
                    <p className="mt-2 text-sm leading-6 text-vegr-ink">
                      {draft.rejectionReason}
                    </p>
                  </div>
                )}
              </section>

              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-vegr-berry-soft bg-white lg:col-start-1 lg:row-start-2">
                  {draft.imageUrl ? (
                    <Image src={draft.imageUrl} alt={draft.name || "Recipe image"} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover"/>
                  ) : (
                    <RecipeImagePlaceholder variant="upload" iconClassName="size-20"/>
                  )}

                  <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                  className="absolute bottom-5 left-5 h-11 bg-vegr-green px-5 text-white shadow-md hover:bg-vegr-green-dark" >
                    <ImagePlus />
                    {isUploading ? "Uploading..." : draft.imageUrl ? "Replace image" : "Upload image"}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                    }}
                  />
              </div>

              <section className="min-w-0 pt-1 lg:col-start-2 lg:row-start-2">
                <Label htmlFor="recipe-description" className="font-indie-flower text-3xl font-bold">
                  Description
                </Label>
                <textarea id="recipe-description" value={draft.description} onChange={(event) => updateDraft("description", event.target.value)}
                  placeholder="Recipe description"
                  rows={5}
                  className="mt-3 w-full resize-y rounded-lg border border-vegr-berry-soft bg-white px-4 py-3 text-base leading-6 outline-none focus:border-vegr-green focus:ring-2 focus:ring-vegr-green-soft"
                />

                <div className="mt-6">
                  <p className="text-sm font-bold uppercase text-vegr-berry-dark">
                    Tags
                  </p>
                  <div className="mt-3 flex min-h-9 flex-wrap items-center gap-2">
                    {draft.tags.map((tag) => (
                      <span key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-vegr-green/25 bg-vegr-green-soft px-3 py-1 text-xs font-semibold text-vegr-green-dark"
                      >
                        {formatRecipeEnum(tag)}
                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${formatRecipeEnum(tag)}`}
                          title={`Remove ${formatRecipeEnum(tag)}`}
                          className="rounded-full p-0.5 hover:bg-white"
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    ))}

                    <RecipeTagPicker selectedTags={draft.tags} onAddTag={addTag}/>
                  </div>
                </div>

                {!ingredientsAreExpanded && (
                  <IngredientsEditor servings={draft.servings} ingredients={draft.ingredients} className="mt-12"
                    onServingsChange={(value) => updateDraft("servings", value)}
                    onIngredientChange={updateIngredient}
                    onIngredientAdd={addIngredient}
                    onIngredientRemove={removeIngredient}
                  />
                )}
              </section>
            </div>

            {ingredientsAreExpanded && (
              <IngredientsEditor servings={draft.servings} ingredients={draft.ingredients} expanded className="mt-12"
                onServingsChange={(value) => updateDraft("servings", value)}
                onIngredientChange={updateIngredient}
                onIngredientAdd={addIngredient}
                onIngredientRemove={removeIngredient}
              />
            )}

            <div className="mt-20 grid items-start gap-8 lg:grid-cols-2">
              <InstructionsEditor
                type="prep"
                steps={draft.stepsPrep}
                onChange={(rowId, text) =>
                  updateInstruction("stepsPrep", rowId, text)
                }
                onAdd={() => addInstruction("stepsPrep")}
                onRemove={(rowId) => removeInstruction("stepsPrep", rowId)}
              />
              <InstructionsEditor
                type="cook"
                steps={draft.stepsCook}
                onChange={(rowId, text) =>
                  updateInstruction("stepsCook", rowId, text)
                }
                onAdd={() => addInstruction("stepsCook")}
                onRemove={(rowId) => removeInstruction("stepsCook", rowId)}
              />
            </div>

            {(error || notice) && (
              <p
                role="status"
                className={cn( "mt-8 rounded-md border px-4 py-3 text-sm font-medium",
                  error ? "border-red-200 bg-red-50 text-red-700" : "border-vegr-green/25 bg-vegr-green-soft text-vegr-green-dark"
                )}
              >
                {error || notice}
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Button type="button" onClick={() => setSubmitDialogOpen(true)} disabled={isSaving || isUploading}
              className="h-11 bg-vegr-green px-5 text-white hover:bg-vegr-green-dark"
              >
                <Send />
                Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void saveDraft("save")}
                disabled={isSaving || isUploading}
                className="h-11 border-vegr-berry bg-white px-5 text-vegr-berry hover:bg-vegr-berry-soft"
              >
                <Save />
                Save Draft
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isSaving || isUploading}
                className="h-11 px-5"
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit recipe"
        description="Are you sure you want to submit your recipe for review and post it?"
        confirmLabel="Submit"
        isPending={isSaving}
        onConfirm={() => void saveDraft("submit")}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete draft"
        description="Are you sure you want to permanently delete your draft?"
        confirmLabel="Delete"
        destructive
        isPending={isSaving}
        onConfirm={() => void deleteDraft()}
      />
    </main>
  );
}

function NumberField({ id, label, value, min, suffix, onChange }: {
  id: string;
  label: string;
  value: number | null;
  min: number;
  suffix: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-full border border-vegr-berry-soft bg-white px-4 text-sm font-bold shadow-sm">
      <Label htmlFor={id}>{label}:</Label>
      <Input
        id={id}
        type="number"
        min={min}
        step={1}
        value={value ?? ""}
        onChange={(event) => onChange(numberOrNull(event.target.value))}
        className="h-7 w-16 rounded-none border-0 px-1 text-center shadow-none focus-visible:ring-0"
      />
      <span>{suffix}</span>
    </div>
  );
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive = false, isPending, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="border-vegr-berry-soft bg-vegr-cream sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-indie-flower text-3xl font-bold text-vegr-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="leading-6 text-zinc-700">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
            className={destructive ? undefined : "bg-vegr-green text-white hover:bg-vegr-green-dark"}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecipeWriterLoading() {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] animate-pulse gap-10 px-6 py-10 md:px-12 lg:grid-cols-2 lg:px-16">
      <div>
        <div className="h-14 w-2/3 rounded bg-vegr-berry-soft" />
        <div className="mt-6 aspect-[16/10] rounded-lg bg-vegr-green-soft" />
      </div>
      <div className="space-y-5 pt-16">
        <div className="h-9 w-1/3 rounded bg-vegr-berry-soft" />
        <div className="h-28 w-full rounded bg-white" />
        <div className="h-64 w-full rounded bg-vegr-green-soft" />
      </div>
    </div>
  );
}

function numberOrNull(value: string) {
  return value === "" ? null : Number(value);
}
