import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/helpers/cn";

interface EmptyStateProps {
  /** Omit for the compact inline variant (Overview trips): just the sentence and the button. */
  icon?: LucideIcon;
  title?: string;
  description: string;
  action: { label: string; href: string; arrow?: boolean };
  className?: string;
}

const BUTTON = "mt-5 h-9 w-full px-4 text-sm uppercase tracking-cta sm:w-auto";

/** Cream empty box inside a section card: what belongs here, why it matters, one full-width action on mobile. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const cta = (
    <ButtonLink href={action.href} size="md" className={cn(BUTTON, !Icon && "mt-0")}>
      {action.label}
      {action.arrow ? <ArrowRight aria-hidden className="size-4" /> : null}
    </ButtonLink>
  );

  if (!Icon) {
    return (
      <div className={cn("mt-5 rounded-card bg-surface p-4 sm:p-5", className)}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-body">{description}</p>
          {cta}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-5 rounded-card bg-surface px-4 py-8 text-center sm:mt-6 sm:px-5 sm:py-10", className)}>
      <Icon aria-hidden className="mx-auto size-6 text-accent" />
      {title ? <h3 className="mt-3 font-display text-title-sm font-medium text-primary">{title}</h3> : null}
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">{description}</p>
      {cta}
    </div>
  );
}
