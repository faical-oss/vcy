import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

/** Round 40px icon-only button (carousel arrows). Always pass an aria-label. */
export function IconButton({
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
