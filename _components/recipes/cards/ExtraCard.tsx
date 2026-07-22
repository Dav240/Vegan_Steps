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
        "flex min-h-[380px] w-full max-w-[370px] self-stretch flex-col overflow-hidden rounded-lg border border-brand-berry-soft bg-brand-gold-soft text-brand-berry shadow-sm",
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        const actionClassName = cn(
          "brand-extra-card-action group/action flex min-h-0 flex-1 flex-col items-center justify-center bg-brand-gold-soft p-5 text-center text-brand-berry transition-colors hover:bg-brand-berry hover:text-white focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-berry disabled:cursor-wait disabled:opacity-60",
          index > 0 && "border-t border-brand-berry-soft"
        );
        const content = (
          <>
            <span className="brand-extra-card-icon-badge flex size-16 items-center justify-center rounded-full border-2 border-brand-berry bg-brand-berry text-white transition-colors group-hover/action:border-brand-cream group-hover/action:bg-brand-cream group-hover/action:text-brand-berry">
              <Icon
                className={cn("brand-extra-card-icon size-8", action.iconClassName)}
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
