"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { useSession, type CurrentUser } from "@/lib/session";

type EditableField = "username" | "email";

type FieldMessage = {
  type: "error" | "success";
  text: string;
} | null;

export default function ProfileDetails() {
  const { currentUser, setCurrentUser } = useSession();
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [pendingField, setPendingField] = useState<EditableField | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<FieldMessage>(null);
  const [emailMessage, setEmailMessage] = useState<FieldMessage>(null);

  useEffect(() => {
    if (!currentUser.id || currentUser.userType === "VISITOR") {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/profile?userId=${encodeURIComponent(currentUser.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load your profile.");
        }

        return data.user as CurrentUser;
      })
      .then((user) => {
        setCurrentUser(user);
        setUsername(user.username);
        setEmail(user.email);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setUsernameMessage({
            type: "error",
            text: error.message,
          });
        }
      });

    return () => controller.abort();
  }, [currentUser.id, currentUser.userType, setCurrentUser]);

  async function updateField(field: EditableField) {
    if (!currentUser.id) {
      return;
    }

    const value = field === "username" ? username : email;
    const setMessage =
      field === "username" ? setUsernameMessage : setEmailMessage;

    setPendingField(field);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          field,
          value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Could not update your profile.",
        });
        return;
      }

      const updatedUser = data.user as CurrentUser;
      setCurrentUser(updatedUser);
      setUsername(updatedUser.username);
      setEmail(updatedUser.email);
      setMessage({
        type: "success",
        text: data.message,
      });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Could not connect to the server. Please try again.",
      });
    } finally {
      setPendingField(null);
    }
  }

  const initial = (username || currentUser.username || "U").charAt(0).toUpperCase();

  return (
    <section className="w-full pb-8">
      <h1 className="font-indie-flower text-5xl font-bold text-vegr-ink">
        Profile
      </h1>

      <div className="mt-8 grid grid-cols-[72px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-7">
        <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-vegr-green bg-vegr-green-soft font-indie-flower text-4xl font-bold text-vegr-green-dark shadow-sm ring-4 ring-vegr-gold-soft sm:size-24 sm:text-5xl">
          {initial}
        </div>

        <div className="max-w-2xl space-y-6">
          <ProfileField id="profile-username" label="Username" type="text" 
            value={username} 
            pending={pendingField === "username"} 
            message={usernameMessage}
            onChange={setUsername}
            onSave={() => updateField("username")}
          />

          <ProfileField id="profile-email" label="Email" type="email" 
            value={email} 
            pending={pendingField === "email"} 
            message={emailMessage}
            onChange={setEmail}
            onSave={() => updateField("email")} />

          <Button type="button" variant="outline"
            className="border-vegr-berry bg-white text-vegr-berry shadow-sm hover:bg-vegr-berry-soft hover:text-vegr-berry-dark"
          >
            Change Password
          </Button>
        </div>
      </div>
    </section>
  );
}

function ProfileField({ id, label, type, value, pending, message, onChange, onSave }: {
  id: string;
  label: string;
  type: "text" | "email";
  value: string;
  pending: boolean;
  message: FieldMessage;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_40px] items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor={id} className="font-semibold text-vegr-berry-dark">
            {label}
          </Label>
          <Input
            id={id}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 border-vegr-berry-soft bg-white text-vegr-ink shadow-sm focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          aria-label={`Save ${label.toLowerCase()}`}
          className="flex size-10 items-center justify-center rounded-md border border-vegr-green-dark bg-vegr-green text-white shadow-sm transition-colors hover:bg-vegr-green-dark disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Check className="size-5" />
          )}
        </button>
      </div>

      {message && (
        <p
          className={
            message.type === "error"
              ? "mt-2 text-sm text-red-700"
              : "mt-2 text-sm text-vegr-green-dark"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
