import { type ReactNode } from "react";

export default function LegalCheckbox({ checked, onCheckedChange, children }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm leading-5 text-zinc-700">
      <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-1 size-4 accent-brand-green"/>
      <span>{children}</span>
    </label>
  );
}