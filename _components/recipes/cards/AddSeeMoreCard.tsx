import { ArrowRight, Plus } from "lucide-react";

import ExtraCard from "@/_components/recipes/cards/ExtraCard";

export default function AddSeeMoreCard() {
  return (
    <ExtraCard
      actions={[
        {
          label: "Write recipe",
          ariaLabel: "Go to the Write Recipe page",
          icon: Plus,
          href: "/write-recipe",
        },
        {
          label: "See more",
          ariaLabel: "See all of my recipes",
          icon: ArrowRight,
          href: "/my-recipes",
          iconClassName:
            "transition-transform group-hover/action:translate-x-1",
        },
      ]}
    />
  );
}
