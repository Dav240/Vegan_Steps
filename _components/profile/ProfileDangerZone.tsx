"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { useSession } from "@/lib/session";

type DialogMode = "optional-data" | "account" | null;

export default function ProfileDangerZone() {
  const router = useRouter();
  const { setCurrentUser } = useSession();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function deleteOptionalData() {
    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile/optional-data", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete optional data.");
      }

      setDialogMode(null);
      setMessage(data.message || "Optional data deleted.");
      window.dispatchEvent(new Event("vegr-optional-data-deleted"));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete optional data."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function deleteAccount() {
    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile/account", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete your account.");
      }

      setCurrentUser(data.user);
      setDialogMode(null);
      router.replace("/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete your account."
      );
      setIsDeleting(false);
    }
  }

  const isAccountDelete = dialogMode === "account";

  return (
    <section className="mt-8 max-w-2xl rounded-lg border border-deep-crimson-200 bg-deep-crimson-50 p-5 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wide text-deep-crimson-700">
        Account controls
      </p>
      <h2 className="mt-1 text-2xl font-bold text-vegr-ink">Danger zone</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-700">
        Optional data can be removed without deleting your account. Account
        deletion signs you out and queues the account for permanent deletion.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogMode("optional-data")}
          className="border-vegr-berry bg-white text-vegr-berry hover:bg-vegr-berry-soft"
        >
          Delete Optional Data
        </Button>
        <Button
          type="button"
          onClick={() => setDialogMode("account")}
          className="bg-deep-crimson-600 font-bold text-white hover:bg-deep-crimson-700"
        >
          <Trash2 className="size-4" />
          Delete My Account
        </Button>
      </div>

      {message && (
        <p className="mt-4 rounded-md bg-vegr-green-soft px-3 py-2 text-sm font-medium text-vegr-green-dark">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-medium text-deep-crimson-700">
          {error}
        </p>
      )}

      <Dialog open={Boolean(dialogMode)} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="border-deep-crimson-200 bg-vegr-cream text-vegr-ink sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isAccountDelete ? "Delete account?" : "Delete optional data?"}
            </DialogTitle>
            <DialogDescription className="leading-6 text-zinc-700">
              {isAccountDelete
                ? "This soft deletes your account, signs you out, hides your recipes, and queues the account for permanent deletion."
                : "This deletes recipe view history and turns off personalised recommendations, analytics, and product emails."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogMode(null)}
              disabled={isDeleting}
              className="border-vegr-berry-soft bg-white text-vegr-ink hover:bg-vegr-berry-soft"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={() =>
                isAccountDelete
                  ? void deleteAccount()
                  : void deleteOptionalData()
              }
              className="bg-deep-crimson-600 font-bold text-white hover:bg-deep-crimson-700"
            >
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
