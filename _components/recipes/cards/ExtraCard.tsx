"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ExtraCardAction = {
  label: string;
  ariaLabel: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  iconClassName?: string;
};

export default function ExtraCard({
  actions,
  className,
}: {
  actions: ExtraCardAction[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[380px] w-full max-w-[370px] self-stretch flex-col overflow-hidden rounded-lg border border-vegr-berry-soft bg-vegr-gold-soft text-vegr-ink shadow-sm",
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        const actionClassName = cn(
          "group/action flex min-h-0 flex-1 flex-col items-center justify-center p-5 text-center transition-colors hover:bg-vegr-peach focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vegr-berry disabled:cursor-wait disabled:opacity-60",
          index > 0 && "border-t border-vegr-berry-soft"
        );
        const content = (
          <>
            <span className="flex size-16 items-center justify-center rounded-full border-2 border-vegr-berry bg-vegr-cream text-vegr-berry">
              <Icon
                className={cn("size-8", action.iconClassName)}
                aria-hidden="true"
              />
            </span>
            <span className="mt-4 text-lg font-bold">{action.label}</span>
          </>
        );

        if (action.href) {
          return (
            <Link
              key={`${action.label}-${index}`}
              href={action.href}
              aria-label={action.ariaLabel}
              title={action.title}
              className={actionClassName}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={`${action.label}-${index}`}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.ariaLabel}
            title={action.title}
            className={actionClassName}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
