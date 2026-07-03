"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import PasswordResetRequestDialog from "@/_components/login/PasswordResetRequestDialog";
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
  const [isSendingEmailCodes, setIsSendingEmailCodes] = useState(false);
  const [emailCodesSent, setEmailCodesSent] = useState(false);
  const [oldEmailCode, setOldEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
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
        setEmailCodesSent(false);
        setOldEmailCode("");
        setNewEmailCode("");
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
          ...(field === "email"
            ? {
                oldEmailCode,
                newEmailCode,
              }
            : {}),
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
      if (field === "email") {
        setEmailCodesSent(false);
        setOldEmailCode("");
        setNewEmailCode("");
      }
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

  async function sendEmailChangeCodes() {
    if (!currentUser.id) {
      return;
    }

    setIsSendingEmailCodes(true);
    setEmailCodesSent(false);
    setEmailMessage(null);
    setOldEmailCode("");
    setNewEmailCode("");

    try {
      const response = await fetch("/api/email/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "CHANGE_EMAIL",
          userId: currentUser.id,
          newEmail: email,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEmailMessage({
          type: "error",
          text: data.error || "Could not send verification codes.",
        });
        return;
      }

      setEmailCodesSent(true);
      setEmailMessage({
        type: "success",
        text: data.message || "Verification codes sent.",
      });
    } catch (error) {
      console.error(error);
      setEmailMessage({
        type: "error",
        text: "Could not connect to the server. Please try again.",
      });
    } finally {
      setIsSendingEmailCodes(false);
    }
  }

  const initial = (username || currentUser.username || "U").charAt(0).toUpperCase();

  return (
    <>
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

            <ProfileEmailField
              email={email}
              oldEmailCode={oldEmailCode}
              newEmailCode={newEmailCode}
              pending={pendingField === "email"}
              sending={isSendingEmailCodes}
              codesSent={emailCodesSent}
              message={emailMessage}
              onEmailChange={(value) => {
                setEmail(value);
                setEmailMessage(null);
                setEmailCodesSent(false);
                setOldEmailCode("");
                setNewEmailCode("");
              }}
              onOldEmailCodeChange={setOldEmailCode}
              onNewEmailCodeChange={setNewEmailCode}
              onSendCodes={() => void sendEmailChangeCodes()}
              onConfirm={() => updateField("email")}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordResetOpen(true)}
              className="border-vegr-berry bg-white text-vegr-berry shadow-sm hover:bg-vegr-berry-soft hover:text-vegr-berry-dark"
            >
              Change Password
            </Button>
          </div>
        </div>
      </section>

      <PasswordResetRequestDialog
        key={currentUser.email}
        open={passwordResetOpen}
        onOpenChange={setPasswordResetOpen}
        email={currentUser.email}
        title="Change password?"
        prompt="Send a password reset link to your current email address?"
        allowEmailEdit={false}
      />
    </>
  );
}

function ProfileEmailField({ email, oldEmailCode, newEmailCode, pending, sending, codesSent, message,
  onEmailChange,
  onOldEmailCodeChange,
  onNewEmailCodeChange,
  onSendCodes,
  onConfirm,
}: {
  email: string;
  oldEmailCode: string;
  newEmailCode: string;
  pending: boolean;
  sending: boolean;
  codesSent: boolean;
  message: FieldMessage;
  onEmailChange: (value: string) => void;
  onOldEmailCodeChange: (value: string) => void;
  onNewEmailCodeChange: (value: string) => void;
  onSendCodes: () => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <div className="space-y-2">
        <Label htmlFor="profile-email" className="font-semibold text-vegr-berry-dark">
          Email
        </Label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Input id="profile-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)}
            className="h-10 border-vegr-berry-soft bg-white text-vegr-ink shadow-sm focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"
          />
          <button type="button" onClick={onSendCodes} disabled={sending || pending}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-vegr-green bg-white px-3 text-sm font-semibold text-vegr-green-dark shadow-sm transition-colors hover:bg-vegr-green-soft disabled:cursor-wait disabled:opacity-60"
          >
            {sending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Send codes
          </button>
        </div>
      </div>

      {codesSent && (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="profile-old-email-code" className="text-sm text-zinc-700">
              Current email code
            </Label>
            <Input id="profile-old-email-code" type="text" value={oldEmailCode} onChange={(event) => onOldEmailCodeChange(event.target.value)}
              placeholder="Code sent to current email"
              className="h-10 border-vegr-berry-soft bg-white text-vegr-ink shadow-sm focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_40px] items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="profile-new-email-code" className="text-sm text-zinc-700">
                New email code
              </Label>
              <Input id="profile-new-email-code" type="text" value={newEmailCode}
                onChange={(event) => onNewEmailCodeChange(event.target.value)}
                placeholder="Code sent to new email"
                className="h-10 border-vegr-berry-soft bg-white text-vegr-ink shadow-sm focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"
              />
            </div>

            <button type="button" onClick={onConfirm} disabled={pending || sending}
              aria-label="Confirm email change"
              className="flex size-10 items-center justify-center rounded-md border border-vegr-green-dark bg-vegr-green text-white shadow-sm transition-colors hover:bg-vegr-green-dark disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <Check className="size-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={
            message.type === "error" ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-vegr-green-dark"
          }
        >
          {message.text}
        </p>
      )}
    </div>
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
            message.type === "error" ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-vegr-green-dark"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
