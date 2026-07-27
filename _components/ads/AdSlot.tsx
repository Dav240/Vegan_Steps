import Script from "next/script";

import { cn } from "@/lib/utils";

type AdSlotVariant = "horizontal" | "rail" | "compact";

const ADSENSE_CLIENT_ID = "ca-pub-4242261254772442";

export default function AdSlot({
  label = "Advertisement",
  variant = "horizontal",
  className,
}: {
  label?: string;
  variant?: AdSlotVariant;
  className?: string;
}) {
  return (
    <>
      <Script
        id="google-adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <aside
        aria-label={label}
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-brand-green/35 bg-brand-green-soft/35 text-xs font-bold uppercase tracking-[0.2em] text-brand-green-dark/70",
          variant === "horizontal" && "min-h-28 w-full px-6 text-center",
          variant === "rail" && "min-h-[520px] w-full px-4 text-center",
          variant === "compact" && "min-h-24 w-full px-4 text-center",
          className
        )}
      >
        {label}
      </aside>
    </>
  );
}
