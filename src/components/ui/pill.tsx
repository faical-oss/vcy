import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

export type PillTone = "outline" | "soft" | "compact";

/** Chip look shared by `Pill` (button) and link chips. `active` = filled navy; inactive is outlined, or a borderless soft fill with the "soft" tone. */
export function pillClassName(active: boolean, tone: PillTone = "outline"): string {
  if (tone === "compact") {
    return cn(
      "h-[30px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[14px] font-medium transition-colors",
      active ? "border-muted-blue bg-primary text-primary-foreground" : "border-border bg-card text-body hover:border-primary",
    );
  }
  return cn(
    "h-[34px] shrink-0 whitespace-nowrap rounded-full border px-4 text-chip uppercase transition-colors",
    active
      ? "border-muted-blue bg-primary font-semibold text-primary-foreground"
      : tone === "soft"
        ? "border-transparent bg-surface font-normal text-primary hover:bg-surface-blue"
        : "border-border bg-card font-normal text-primary hover:border-primary",
  );
}

/** Filter chip. `active` = filled navy. */
export function Pill({
  active = false,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(pillClassName(active), className)}
      {...props}
    />
  );
}
