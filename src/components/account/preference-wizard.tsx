"use client";

import { ChevronLeft, Compass, Earth, HeartHandshake, Map, Sparkles, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActivityTile } from "@/components/account/activity-tile";
import { Chip } from "@/components/ui/chip";
import { ACTIVITY_IMAGES } from "@/constants/activity-images";
import { PICK_GRID } from "@/constants/grids";
import { PREFERENCE_CATEGORIES } from "@/constants/preferences";
import { cn } from "@/helpers/cn";
import { toggleId } from "@/helpers/preferences";
import type { PreferenceCategory, TravelPreferences } from "@/interfaces";

export const CATEGORY_ICONS: Record<PreferenceCategory, LucideIcon> = {
  experiences: Sparkles,
  regions: Earth,
  places: Map,
  purpose: HeartHandshake,
  style: Users,
};

interface PreferenceWizardProps {
  initial: TravelPreferences;
  /** Resolves to an error message when saving failed (input is kept), or null on success. */
  onSave: (preferences: TravelPreferences) => Promise<string | null>;
  /** Shown only when editing existing preferences, so there is a way out. */
  onCancel?: () => void;
}

/** Five optional steps. CONTINUE works with nothing selected; Back keeps every selection. */
export function PreferenceWizard({ initial, onSave, onCancel }: PreferenceWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<TravelPreferences>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const category = PREFERENCE_CATEGORIES[stepIndex]!;
  const Icon = CATEGORY_ICONS[category.key];
  const selected = draft[category.key];
  const isLast = stepIndex === PREFERENCE_CATEGORIES.length - 1;
  const total = PREFERENCE_CATEGORIES.length;

  // After Continue/Back: bring the card's top into view (instant under reduced motion) and focus the new question.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    cardRef.current?.scrollIntoView?.({ behavior: reduced ? "auto" : "smooth", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [stepIndex]);

  const toggle = (id: string) => setDraft((current) => ({ ...current, [category.key]: toggleId(current[category.key], id) }));

  async function handlePrimary() {
    if (!isLast) {
      setStepIndex((index) => index + 1);
      return;
    }
    setSaving(true);
    setError(null);
    const failure = await onSave(draft);
    if (failure) {
      setError(failure);
      setSaving(false);
    }
  }

  return (
    <section ref={cardRef} aria-labelledby="wizard-title" className="scroll-mt-20 overflow-hidden rounded-card bg-card shadow-sm">
      <div className="border-b border-border p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-blue">
            <Compass aria-hidden className="size-4 text-accent" />
            Personalize your journey
          </p>
          <p className="text-xs font-medium text-body">
            Step {stepIndex + 1} of {total}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Preferences progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={stepIndex + 1}
          aria-valuetext={`Step ${stepIndex + 1} of ${total}`}
          className="mt-4 grid grid-cols-5 gap-1.5"
        >
          {PREFERENCE_CATEGORIES.map((entry, index) => (
            <span key={entry.key} aria-hidden className={cn("h-1.5 rounded-full", index <= stepIndex ? "bg-accent" : "bg-border")} />
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-blue">
            <Icon className="size-5 text-accent" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-blue">{category.eyebrow}</p>
            <h2
              id="wizard-title"
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 font-display text-heading-xs font-medium leading-tight text-primary focus:outline-none sm:text-heading"
            >
              {category.question}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">{category.helper}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p id="wizard-select-label" className="text-xs font-semibold uppercase tracking-label text-muted-blue">Select all that apply</p>
          <p aria-live="polite" className="text-xs font-medium text-body">
            {selected.length} selected
          </p>
        </div>
        {category.key === "experiences" ? (
          <div role="group" aria-labelledby="wizard-select-label" className={cn("mt-3", PICK_GRID)}>
            {category.options.map((option) => (
              <ActivityTile
                key={option.id}
                label={option.label}
                src={ACTIVITY_IMAGES[option.id]}
                checked={selected.includes(option.id)}
                onCheckedChange={() => toggle(option.id)}
              />
            ))}
          </div>
        ) : (
          <div role="group" aria-labelledby="wizard-select-label" className="mt-3 flex flex-wrap gap-2.5">
            {category.options.map((option) => (
              <Chip key={option.id} selected={selected.includes(option.id)} onSelectedChange={() => toggle(option.id)}>
                {option.label}
              </Chip>
            ))}
          </div>
        )}

        {error ? (
          <p role="alert" className="mt-5 text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex gap-2">
          {stepIndex > 0 ? (
            <Button variant="outline" className="h-9 flex-1 border-primary px-4 text-sm font-medium normal-case tracking-normal sm:flex-none" onClick={() => setStepIndex((index) => index - 1)}>
              <ChevronLeft aria-hidden className="size-4" />
              Back
            </Button>
          ) : onCancel ? (
            <Button variant="outline" className="h-9 flex-1 border-transparent px-4 text-sm font-medium normal-case tracking-normal text-body sm:flex-none" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
        <Button className="h-9 w-full px-4 text-sm uppercase tracking-label sm:w-auto" onClick={handlePrimary} disabled={saving} aria-busy={saving}>
          {isLast ? "Save preferences" : "Continue"}
        </Button>
      </div>
    </section>
  );
}
