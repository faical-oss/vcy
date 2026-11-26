import { Check, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREFERENCE_CATEGORIES } from "@/constants/preferences";
import { countSelected, formatSelectedCount } from "@/helpers/preferences";
import type { TravelPreferences } from "@/interfaces";
import { CATEGORY_ICONS } from "./preference-wizard";

interface PreferenceSummaryProps {
  preferences: TravelPreferences;
  justSaved: boolean;
  onEdit: () => void;
}

/** Everything sits inside one white card: header, success banner, the five category cards and the total. */
export function PreferenceSummary({ preferences, justSaved, onEdit }: PreferenceSummaryProps) {
  const total = countSelected(preferences);
  return (
    <section aria-labelledby="preferences-title" className="rounded-card bg-card p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-blue">
            <Compass aria-hidden className="size-4 text-accent" />
            Travel profile
          </p>
          <h2 id="preferences-title" className="mt-2 font-display text-heading-sm font-medium leading-tight text-primary sm:text-heading">
            Your travel preferences
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">
            We use these signals to make your recommendations more relevant. Update them whenever your travel style changes.
          </p>
        </div>
        <Button className="h-9 w-full px-4 text-sm uppercase tracking-label sm:w-auto" onClick={onEdit}>
          Edit preferences
        </Button>
      </div>

      {justSaved ? (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-input bg-surface-blue p-3 text-sm font-medium text-primary">
          <Check aria-hidden className="size-4 shrink-0 text-accent" />
          Preferences saved. Your recommendations will now reflect these choices.
        </p>
      ) : null}

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {PREFERENCE_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.key];
          const ids = preferences[category.key];
          return (
            <li key={category.key} className="rounded-card border border-border p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface">
                  <Icon className="size-4 text-accent" />
                </span>
                <div className="min-w-0">
                  <p className="text-micro font-semibold uppercase tracking-caption text-muted-blue">{category.eyebrow}</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-primary">{category.question}</h3>
                </div>
              </div>
              {ids.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {ids.map((id) => (
                    <li key={id} className="rounded-full bg-surface-blue px-3 py-1.5 text-xs font-medium text-primary">
                      {category.options.find((option) => option.id === id)?.label ?? id}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm italic text-muted-blue">No preferences selected</p>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs text-body">{formatSelectedCount(total)}</p>
    </section>
  );
}
