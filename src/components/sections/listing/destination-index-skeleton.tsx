import { CardGrid } from "@/components/ui/card-grid";
import { Container } from "@/components/ui/container";
import { TILE_ASPECT } from "@/constants/grids";
import { cn } from "@/helpers/cn";

const BLOCK = "animate-pulse bg-border motion-reduce:animate-none";

/** Region chips and a first group of cards: the part of the All Destinations page that waits for `searchParams`. At least a screen tall: the real list is much longer, and on a tall screen the footer must not be in view while it loads (layout shift). */
export function DestinationIndexResultsSkeleton({ label, cards = 8 }: { label: string; cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="min-h-svh bg-surface">
      <div className="bg-card py-4">
        <Container className="flex gap-2 overflow-hidden px-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={cn(BLOCK, "h-[34px] w-24 shrink-0 rounded-full")} />
          ))}
        </Container>
      </div>
      <div className="bg-surface">
      <Container className="px-6 pb-14 pt-14">
        <div className={cn(BLOCK, "mb-5 h-4 w-24 rounded-card")} />
        <CardGrid kind="tiles">
          {Array.from({ length: cards }, (_, index) => (
            <div key={index} className={cn(BLOCK, TILE_ASPECT)} />
          ))}
        </CardGrid>
      </Container>
      </div>
    </div>
  );
}

/** Loading state of `/destinations`: the hero area, then the chips and cards. */
export function DestinationIndexSkeleton({ label }: { label: string }) {
  return (
    <div>
      <div className="relative h-[340px] w-full bg-primary/10">
        <Container className="absolute inset-0 flex flex-col justify-end px-6 pb-12">
          <div className={cn(BLOCK, "mb-3 h-3 w-24 rounded-card")} />
          <div className={cn(BLOCK, "h-14 w-80 max-w-full rounded-card")} />
          <div className={cn(BLOCK, "mt-3 h-4 w-72 max-w-full rounded-card")} />
        </Container>
      </div>
      <DestinationIndexResultsSkeleton label={label} />
    </div>
  );
}
