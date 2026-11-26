import type { ReactNode } from "react";
import { cn } from "@/helpers/cn";

interface AccountSectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Trailing action (e.g. "Browse more"): below the title on mobile, right-aligned from sm. */
  action?: ReactNode;
  titleClassName?: string;
  className?: string;
  children?: ReactNode;
}

/** Shared white surface card (soft shadow, no border) with the eyebrow + serif h2 header used by every account view. */
export function AccountSection({ id, eyebrow, title, description, action, titleClassName, className, children }: AccountSectionProps) {
  return (
    <section aria-labelledby={id} className={cn("rounded-card bg-card p-5 shadow-sm sm:p-8", className)}>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-widest text-muted-blue">{eyebrow}</p> : null}
          <h2 id={id} className={cn("mt-1 font-display text-heading-xs font-medium text-primary sm:text-heading-sm", titleClassName)}>
            {title}
          </h2>
          {description ? <p className="mt-1 max-w-xl text-sm leading-relaxed text-body">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Inline "BROWSE MORE ->" style link: auto width, no underline until hover. */
export const INLINE_LINK =
  "inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-label text-primary underline-offset-4 hover:underline";
