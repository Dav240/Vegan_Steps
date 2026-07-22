"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

export default function ForgotPasswordResetForm({ tokenId, token }: {
  tokenId: string;
  token: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function resetPassword() {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          token,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not reset your password.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage(data.message || "Password updated successfully.");
    } catch (requestError) {
      console.error(requestError);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-brand-berry-soft bg-white p-8 shadow-[0_28px_70px_rgba(36,27,34,0.38)]">
      <h1 className="text-3xl font-bold text-brand-ink">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-700">
        Choose a new password for your Vegan Steps account.
      </p>

      <div className="mt-6 space-y-5">
        <PasswordField id="new-password" label="New Password" value={password} onChange={setPassword}/>
        <PasswordField id="confirm-new-password" label="Confirm New Password" value={confirmPassword}onChange={setConfirmPassword}/>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md border border-brand-green bg-brand-green-soft p-3 text-sm font-semibold text-brand-green-dark">
            {message}
          </div>
        )}

        <Button type="button" onClick={() => void resetPassword()} disabled={isSubmitting || Boolean(message)}
          className="h-10 w-full bg-brand-green text-white hover:bg-brand-green-dark disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            "Update Password"
          )}
        </Button>

        {message && (
          <Link href="/" className="block text-center text-sm font-semibold text-brand-berry hover:text-brand-berry-dark hover:underline">
            Back to home
          </Link>
        )}
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-semibold text-brand-berry-dark">
        {label}
      </Label>
      <Input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)}
        className="h-10 border-brand-berry-soft bg-white text-brand-ink shadow-sm focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
      />
    </div>
  );
}
