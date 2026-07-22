import { Check, LoaderCircle, Mail } from "lucide-react";

import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

type FieldMessage = {
  type: "error" | "success";
  text: string;
} | null;

export default function ProfileEmailField({ 
    email, 
    oldEmailCode, 
    newEmailCode, 
    pending, 
    sending, 
    codesSent, 
    message,
    onEmailChange,
    onOldEmailCodeChange,
    onNewEmailCodeChange,
    onSendCodes,
    onConfirm,
} : {
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
        <Label htmlFor="profile-email" className="font-semibold text-brand-berry-dark">
          Email
        </Label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <Input id="profile-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)}
            className="h-10 border-brand-berry-soft bg-white text-brand-ink shadow-sm focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
          />
          <button type="button" onClick={onSendCodes} disabled={sending || pending}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-brand-green bg-white px-3 text-sm font-semibold text-brand-green-dark shadow-sm transition-colors hover:bg-brand-green-soft disabled:cursor-wait disabled:opacity-60"
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
            <Label htmlFor="profile-current-verification-code" className="text-sm text-zinc-700">
              Current email code
            </Label>
            <Input
              id="profile-current-verification-code"
              type="text"
              value={oldEmailCode}
              onChange={(event) => onOldEmailCodeChange(event.target.value)}
              placeholder="Code sent to current email"
              autoComplete="off"
              inputMode="numeric"
              spellCheck={false}
              className="h-10 border-brand-berry-soft bg-white text-brand-ink shadow-sm focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_40px] items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="profile-new-verification-code" className="text-sm text-zinc-700">
                New email code
              </Label>
              <Input
                id="profile-new-verification-code"
                type="text"
                value={newEmailCode}
                onChange={(event) => onNewEmailCodeChange(event.target.value)}
                placeholder="Code sent to new email"
                autoComplete="off"
                inputMode="numeric"
                spellCheck={false}
                className="h-10 border-brand-berry-soft bg-white text-brand-ink shadow-sm focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
              />
            </div>

            <button type="button" onClick={onConfirm} disabled={pending || sending}
              aria-label="Confirm email change"
              className="flex size-10 items-center justify-center rounded-md border border-brand-green-dark bg-brand-green text-white shadow-sm transition-colors hover:bg-brand-green-dark disabled:cursor-wait disabled:opacity-60"
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
            message.type === "error" ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-brand-green-dark"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
