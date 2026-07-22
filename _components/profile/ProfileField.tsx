import { Check, LoaderCircle, Mail } from "lucide-react";

import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

type FieldMessage = {
  type: "error" | "success";
  text: string;
} | null;

export default function ProfileField({ id, label, type, value, pending, message, onChange, onSave }: {
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
          <Label htmlFor={id} className="font-semibold text-brand-berry-dark">
            {label}
          </Label>
          <Input
            id={id}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 border-brand-berry-soft bg-white text-brand-ink shadow-sm focus-visible:border-brand-green focus-visible:ring-brand-green-soft"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          aria-label={`Save ${label.toLowerCase()}`}
          className="flex size-10 items-center justify-center rounded-md border border-brand-green-dark bg-brand-green text-white shadow-sm transition-colors hover:bg-brand-green-dark disabled:cursor-wait disabled:opacity-60"
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
            message.type === "error" ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-brand-green-dark"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
