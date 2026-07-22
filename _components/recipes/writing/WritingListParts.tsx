"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

export const writingInputClassName = "h-10 border-brand-berry-soft bg-white text-brand-ink focus-visible:border-brand-green focus-visible:ring-brand-green-soft";

export const writingSelectClassName = "h-10 w-full rounded-lg border border-brand-berry-soft bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green-soft";

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
        tone === "green" ? "border-brand-green/20 bg-brand-green-soft": "border-brand-berry-soft bg-brand-berry-soft/55"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <Icon className="size-7 shrink-0 text-brand-green-dark" aria-hidden="true"/>
        )}
        <h2 className="font-indie-flower text-3xl font-bold text-brand-ink">
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
        "flex h-12 w-full items-center justify-center border border-brand-berry-soft bg-white text-brand-green-dark hover:bg-brand-green-soft disabled:cursor-not-allowed disabled:opacity-40",
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
      className="flex size-10 items-center justify-center rounded-md text-brand-berry hover:bg-brand-berry-soft">
      <X className="size-4" />
    </button>
  );
}
