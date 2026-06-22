import { ArrowRight } from "lucide-react";

import ExtraCard from "@/_components/recipes/cards/ExtraCard";

export default function SeeMoreCard({
  href = "/my-recipes",
  label = "See all of my recipes",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <ExtraCard
      className={className}
      actions={[
        {
          label: "See more",
          ariaLabel: label,
          icon: ArrowRight,
          href,
          iconClassName: "transition-transform group-hover/action:translate-x-1",
        },
      ]}
    />
  );
}
