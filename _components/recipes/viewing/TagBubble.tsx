import { cn } from "@/lib/utils";

export default function TagBubble({ tag, className }: {
  tag: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-vegr-green/25 bg-vegr-green-soft px-2.5 py-1 text-xs font-semibold text-vegr-green-dark",
        className
      )}
    >
      {formatTag(tag)}
    </span>
  );
}

function formatTag(tag: string) {
  return tag.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}
