import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeClasses = { sm: "size-4", md: "size-5", lg: "size-7" };

export default function StarsRating({ rating, size = "sm", className }: {
  rating: number;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const normalizedRating = Math.min(5, Math.max(0, rating));
  const starSize = sizeClasses[size];

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${normalizedRating.toFixed(1)} out of 5 stars`}
      title={`${normalizedRating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fillPercentage = Math.min( 100, Math.max(0, (normalizedRating - index) * 100));

        return (
          <span key={index} className={cn("relative block shrink-0", starSize)}aria-hidden="true">
            <Star className={cn( "absolute inset-0 fill-transparent text-vegr-gold-dark", starSize)}/>
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
              <Star className={cn( "fill-vegr-gold text-vegr-gold-dark", starSize)}/>
            </span>
          </span>
        );
      })}
    </div>
  );
}
