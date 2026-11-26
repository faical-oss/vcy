import { cn } from "@/helpers/cn";

/** Stand-in for photography until real images are wired (Asset Zen). Decorative. */
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("bg-gradient-to-br from-muted-blue/60 via-surface-blue to-muted-blue/30", className)}
    />
  );
}
