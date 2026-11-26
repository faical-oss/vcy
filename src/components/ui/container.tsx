import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

/** Centered content column (1280px max, 24px gutters) used by every section. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-site px-4 sm:px-6", className)} {...props} />;
}
