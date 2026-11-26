import { Container } from "@/components/ui/container";
import { cn } from "@/helpers/cn";
import { ResultsSkeleton } from "./listing-skeleton";

const BLOCK = "animate-pulse bg-border motion-reduce:animate-none";

/** Loading state that mirrors a destination page: tall hero, facts row, intro, chips and the card grid. */
export function DestinationSkeleton({ label, cards = 6 }: { label: string; cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <div className="relative h-[340px] w-full bg-primary/10">
        <Container className="absolute inset-0 flex flex-col justify-end px-6 pb-8">
          <div className={cn(BLOCK, "mb-3 h-3 w-48 rounded-card")} />
          <div className={cn(BLOCK, "h-12 w-72 max-w-full rounded-card")} />
          <div className={cn(BLOCK, "mt-2 h-4 w-56 max-w-full rounded-card")} />
        </Container>
      </div>
      <Container className="px-6">
        <div className="flex flex-wrap gap-x-16 gap-y-4 py-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <div className={cn(BLOCK, "h-3 w-20 rounded-card")} />
              <div className={cn(BLOCK, "h-4 w-16 rounded-card")} />
            </div>
          ))}
        </div>
        <div className="max-w-[720px] space-y-2 pt-8">
          <div className={cn(BLOCK, "h-4 w-full rounded-card")} />
          <div className={cn(BLOCK, "h-4 w-2/3 rounded-card")} />
        </div>
        <div className="pb-14 pt-8">
          <div className={cn(BLOCK, "mb-6 h-7 w-64 max-w-full rounded-card")} />
          <div className="mb-8 flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={cn(BLOCK, "h-[34px] w-28 shrink-0 rounded-full")} />
            ))}
          </div>
          <ResultsSkeleton cards={cards} />
        </div>
      </Container>
    </div>
  );
}
