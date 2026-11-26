import { cn } from "@/helpers/cn";

const BLOCK = "animate-pulse rounded-card bg-border motion-reduce:animate-none";

/** Content-area skeleton that mirrors a view: heading block plus cards. Not a spinner. */
export function ViewSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      <div className={cn(BLOCK, "h-3 w-24")} />
      <div className={cn(BLOCK, "mt-3 h-8 w-64 max-w-full")} />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className={cn(BLOCK, "h-32")} />
        ))}
      </div>
      <div className={cn(BLOCK, "mt-6 h-48")} />
    </div>
  );
}
