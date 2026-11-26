import { Container } from "@/components/ui/container";
import { LISTING_GRID } from "@/constants/grids";
import { cn } from "@/helpers/cn";

const BLOCK = "animate-pulse bg-border motion-reduce:animate-none";

/** Results line and card grid placeholders. Also the Suspense fallback of request-time results. */
export function ResultsSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <>
      <div className={cn(BLOCK, "mb-6 h-4 w-20 rounded-card")} />
      <div className={LISTING_GRID}>
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className={cn(BLOCK, "aspect-[4/3] w-full")} />
            <div className="flex flex-col gap-2 p-4">
              <div className={cn(BLOCK, "h-6 w-4/5 rounded-card")} />
              <div className={cn(BLOCK, "h-3 w-1/2 rounded-card")} />
              <div className={cn(BLOCK, "h-3 w-2/3 rounded-card")} />
              <div className={cn(BLOCK, "mt-3 h-4 w-full rounded-card")} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Loading state that mirrors a listing page: hero band, results line and a grid of card placeholders. Not a spinner. */
export function ListingSkeleton({ label, cards = 6 }: { label: string; cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <div className="relative h-[260px] w-full bg-primary/10">
        <Container className="absolute inset-0 flex flex-col justify-end pb-6">
          <div className={cn(BLOCK, "mb-3 h-3 w-48 rounded-card")} />
          <div className={cn(BLOCK, "h-10 w-72 max-w-full rounded-card")} />
        </Container>
      </div>
      <Container className="py-10">
        <ResultsSkeleton cards={cards} />
      </Container>
    </div>
  );
}
