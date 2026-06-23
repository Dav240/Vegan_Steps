"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const writingInputClassName = "h-10 border-vegr-berry-soft bg-white text-vegr-ink focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft";

export const writingSelectClassName = "h-10 w-full rounded-lg border border-vegr-berry-soft bg-white px-3 text-sm text-vegr-ink outline-none focus:border-vegr-green focus:ring-2 focus:ring-vegr-green-soft";

export function WritingListHeader({ title, icon: Icon, accessory, tone = "berry", standalone = false }: {
  title: string;
  icon?: LucideIcon;
  accessory?: ReactNode;
  tone?: "berry" | "green";
  standalone?: boolean;
}) {
  return (
    <div
      className={cn( "flex min-h-20 items-center justify-between gap-5 border px-5 py-4",
        standalone ? "rounded-lg" : "rounded-t-lg border-b-0",
        tone === "green" ? "border-vegr-green/20 bg-vegr-green-soft": "border-vegr-berry-soft bg-vegr-berry-soft/55"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <Icon className="size-7 shrink-0 text-vegr-green-dark" aria-hidden="true"/>
        )}
        <h2 className="font-indie-flower text-3xl font-bold text-vegr-ink">
          {title}
        </h2>
      </div>
      {accessory}
    </div>
  );
}

export function WritingAddButton({ label, disabled, standalone = false, onClick }: {
  label: string;
  disabled: boolean;
  standalone?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={cn(
        "flex h-12 w-full items-center justify-center border border-vegr-berry-soft bg-white text-vegr-green-dark hover:bg-vegr-green-soft disabled:cursor-not-allowed disabled:opacity-40",
        standalone ? "mt-4 rounded-lg shadow-sm" : "rounded-b-lg"
      )}
    >
      <Plus className="size-5" />
    </button>
  );
}

export function WritingRemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="flex size-10 items-center justify-center rounded-md text-vegr-berry hover:bg-vegr-berry-soft">
      <X className="size-4" />
    </button>
  );
}
