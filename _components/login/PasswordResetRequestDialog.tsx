"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

export default function PasswordResetRequestDialog({ open, onOpenChange, email, 
  title = "Forgot password?", 
  prompt = "Send a password reset link to this email address?",
  allowEmailEdit = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  title?: string;
  prompt?: string;
  allowEmailEdit?: boolean;
}) {
  const [requestEmail, setRequestEmail] = useState(email);
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  function updateOpen(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setRequestEmail(email);
      setError("");
      setSent(false);
      setIsSending(false);
    }
  }

  async function sendPasswordResetEmail() {
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not send the reset email.");
        return;
      }

      setSent(true);
    } catch (requestError) {
      console.error(requestError);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={updateOpen}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (sent) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (sent) {
            event.preventDefault();
          }
        }}
        className={
          sent ? "overflow-hidden border-brand-green bg-brand-green-soft p-0 text-brand-green-dark shadow-xl shadow-brand-green/20 sm:max-w-md"
            : "border-brand-berry bg-brand-cream text-brand-ink shadow-xl shadow-brand-berry-soft/50 sm:max-w-md"
        }
      >
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className={
              sent ? "absolute right-4 top-4 text-brand-green-dark hover:bg-white/45"
                : "absolute right-4 top-4 text-brand-berry hover:bg-brand-berry-soft hover:text-brand-berry-dark"
            }
          >
            <X className="size-5" />
          </Button>
        </DialogClose>

        {sent ? (
          <div className="flex min-h-44 flex-col items-center justify-center px-8 py-10 text-center">
            <CheckCircle2 className="size-11 text-brand-green-dark" />
            <h2 className="mt-4 text-2xl font-bold text-brand-green-dark">
              Email sent
            </h2>
            <p className="mt-2 max-w-xs text-sm font-medium text-brand-green-dark/85">
              Check your inbox for a password reset link.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-ink">
                {title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <p className="text-sm text-zinc-700">{prompt}</p>

              {allowEmailEdit ? (
                <div className="space-y-2">
                  <Label htmlFor="forgot-password-email" className="text-zinc-700">
                    Email
                  </Label>
                  <Input id="forgot-password-email" type="email" value={requestEmail} onChange={(event) => setRequestEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="border-brand-berry-soft bg-white text-brand-ink placeholder:text-zinc-400 focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-brand-berry-soft bg-white px-3 py-2 text-sm font-semibold text-brand-berry-dark">
                  {requestEmail}
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button type="button" onClick={() => void sendPasswordResetEmail()} disabled={isSending}
                  className="w-full bg-brand-green text-white hover:bg-brand-green-dark disabled:cursor-wait disabled:opacity-60"
                >
                  {isSending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    "Yes"
                  )}
                </Button>
                <Button type="button" variant="outline"onClick={() => updateOpen(false)} disabled={isSending}
                  className="w-full border-brand-berry bg-white text-brand-berry hover:bg-brand-berry-soft hover:text-brand-berry-dark"
                >
                  No
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
