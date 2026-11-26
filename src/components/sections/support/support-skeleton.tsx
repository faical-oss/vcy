import { Container } from "@/components/ui/container";
import { cn } from "@/helpers/cn";

const BLOCK = "animate-pulse rounded-card bg-border motion-reduce:animate-none";

/** Loading state that mirrors the Support page: hero band, three topic cards, form card and the sidebar. Not a spinner. */
export function SupportSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading support" className="bg-surface">
      <div className="border-b border-border-soft bg-surface-blue">
        <Container className="flex flex-col items-center py-14 sm:py-20">
          <div className={cn(BLOCK, "h-6 w-24")} />
          <div className={cn(BLOCK, "mt-4 h-3 w-32")} />
          <div className={cn(BLOCK, "mt-4 h-10 w-72 max-w-full")} />
          <div className={cn(BLOCK, "mt-5 h-4 w-full max-w-[672px]")} />
          <div className={cn(BLOCK, "mt-2 h-4 w-2/3 max-w-[448px]")} />
        </Container>
      </div>

      <Container className="py-12">
        <div className={cn(BLOCK, "h-3 w-20")} />
        <div className={cn(BLOCK, "mt-3 h-8 w-80 max-w-full")} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className={cn(BLOCK, "h-28")} />
          ))}
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-card bg-card p-5 shadow-sm sm:p-8">
            <div className={cn(BLOCK, "h-3 w-28")} />
            <div className={cn(BLOCK, "mt-3 h-8 w-56 max-w-full")} />
            <div className={cn(BLOCK, "mt-3 h-4 w-full max-w-md")} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={cn(BLOCK, "h-16")} />
              <div className={cn(BLOCK, "h-16")} />
              <div className={cn(BLOCK, "h-16 sm:col-span-2")} />
              <div className={cn(BLOCK, "h-36 sm:col-span-2")} />
            </div>
            <div className={cn(BLOCK, "ml-auto mt-5 h-9 w-full rounded-full sm:w-40")} />
          </div>
          <div className="flex flex-col gap-4">
            <div className={cn(BLOCK, "h-48")} />
            <div className={cn(BLOCK, "h-52")} />
            <div className={cn(BLOCK, "h-40")} />
          </div>
        </div>
      </Container>
    </div>
  );
}
