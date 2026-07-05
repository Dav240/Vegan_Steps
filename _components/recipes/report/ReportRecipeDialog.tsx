"use client";

import { useState } from "react";
import { Flag, LoaderCircle, X } from "lucide-react";

import { ReportReason } from "@/app/generated/prisma/enums";
import LoginWindow from "@/_components/login/LoginWindow";
import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { useSession } from "@/lib/session";

const REPORT_REASONS = Object.values(ReportReason);

export default function ReportRecipeDialog({
  open,
  onOpenChange,
  recipeId,
  recipeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeName: string;
}) {
  const { currentUser } = useSession();
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState<string>(REPORT_REASONS[0] ?? "");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  async function submitReport() {
    if (!currentUser.id || currentUser.userType === "VISITOR") {
      setLoginOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          recipeId,
          title,
          reason,
          details,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not submit this report.");
      }

      setTitle("");
      setDetails("");
      setMessage(data.message || "Report submitted.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not submit this report."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function close(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setError("");
      setMessage("");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent showCloseButton={false} className="border-vegr-berry-soft bg-vegr-cream sm:max-w-lg">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-vegr-berry hover:bg-vegr-berry-soft"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-vegr-ink">
              <Flag className="size-5 text-vegr-berry" />
              Report recipe
            </DialogTitle>
            <DialogDescription className="text-zinc-700">
              Tell moderators what is wrong with {recipeName || "this recipe"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report name</Label>
              <Input
                id="report-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short report name"
                className="border-vegr-berry-soft bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason</Label>
              <select
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="h-10 w-full rounded-md border border-vegr-berry-soft bg-white px-3 text-sm font-semibold text-vegr-ink outline-none focus:border-vegr-green focus:ring-2 focus:ring-vegr-green-soft"
              >
                {REPORT_REASONS.map((reportReason) => (
                  <option key={reportReason} value={reportReason}>
                    {formatReportReason(reportReason)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-details">Additional details</Label>
              <textarea
                id="report-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                placeholder="Optional details"
                className="w-full resize-y rounded-md border border-vegr-berry-soft bg-white px-3 py-2 text-sm outline-none focus:border-vegr-green focus:ring-2 focus:ring-vegr-green-soft"
              />
            </div>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-md border border-vegr-green/25 bg-vegr-green-soft px-3 py-2 text-sm font-semibold text-vegr-green-dark">
                {message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitReport()}
              disabled={isSubmitting || Boolean(message)}
              className="bg-vegr-green text-white hover:bg-vegr-green-dark"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "Submit report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginWindow
        open={loginOpen}
        onOpenChange={setLoginOpen}
        showTrigger={false}
        redirectAfterAuth={null}
      />
    </>
  );
}

function formatReportReason(reason: string) {
  return reason
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
