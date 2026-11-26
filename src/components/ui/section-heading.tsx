import type { ReactNode } from "react";
import { cn } from "@/helpers/cn";
import { SectionTag } from "./section-tag";

/** Tag + H2 + optional description. `action` sits on the right (link or carousel arrows). */
export function SectionHeading({
  tag,
  title,
  description,
  descriptionClassName,
  titleClassName = "text-title",
  action,
  align = "left",
  id,
  className,
}: {
  tag?: string;
  title: string;
  description?: string;
  descriptionClassName?: string;
  /** Font-size token of the <h2>; replaces the default `text-title`. */
  titleClassName?: string;
  action?: ReactNode;
  align?: "left" | "center";
  /** id of the <h2>, for aria-labelledby on the parent section. */
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 md:flex-row md:items-end",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-1", align === "center" && "items-center")}>
        {tag ? <SectionTag>{tag}</SectionTag> : null}
        <h2 id={id} className={cn("font-display font-medium text-primary", titleClassName)}>{title}</h2>
        {description ? <p className={cn("text-sm text-body", descriptionClassName)}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
