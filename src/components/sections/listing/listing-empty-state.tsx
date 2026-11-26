import { ButtonLink } from "@/components/ui/button";

interface ListingEmptyStateProps {
  title: string;
  description: string;
  action: { label: string; href: string };
}

/** Shown when a listing has no cards: what happened and one way forward. */
export function ListingEmptyState({ title, description, action }: ListingEmptyStateProps) {
  return (
    <div className="rounded-card bg-surface px-4 py-12 text-center sm:px-5">
      <h2 className="font-display text-title-sm font-medium text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">{description}</p>
      <ButtonLink href={action.href} size="md" className="mt-5 w-full tracking-cta sm:w-auto">
        {action.label}
      </ButtonLink>
    </div>
  );
}
