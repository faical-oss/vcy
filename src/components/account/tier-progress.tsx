import { cn } from "@/helpers/cn";
import { tierSegments } from "@/helpers/tier";

/** Thin segmented progress through the Wellness levels, with the level number centred under each segment. */
export function TierProgress({ level, totalLevels }: { level: number; totalLevels: number }) {
  const segments = tierSegments(level, totalLevels);
  return (
    <div role="img" aria-label={`Wellness level ${level} of ${totalLevels}`} className="mt-2 grid grid-cols-3 gap-1">
      {segments.map((segment) => (
        <div key={segment.level} aria-hidden className="text-center">
          <div className={cn("h-1 rounded-full", segment.filled ? "bg-accent" : "bg-border")} />
          <span className={cn("mt-1 block text-pico font-semibold", segment.current ? "text-primary" : "text-muted-blue")}>{segment.level}</span>
        </div>
      ))}
    </div>
  );
}
