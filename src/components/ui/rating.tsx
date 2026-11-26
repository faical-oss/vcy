import { Star } from "lucide-react";
import { cn } from "@/helpers/cn";

/** Five gold stars (floored to whole stars, like the Figma cards) with an optional "4.8 (124)" label: the stars centred on the label, which is one line of text; if the row is too narrow the label wraps below the stars. */
export function Rating({ value, reviewCount, size = "size-[11px]" }: { value: number; reviewCount?: number; size?: string }) {
  const filled = Math.floor(value);
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
      <div className="flex" role="img" aria-label={`${value} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} aria-hidden className={cn(size, i < filled ? "fill-star text-star" : "text-border")} />
        ))}
      </div>
      {reviewCount !== undefined ? (
        <span className="text-caption leading-4 text-body">
          {value} ({reviewCount})
        </span>
      ) : null}
    </div>
  );
}
