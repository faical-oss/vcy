"use client";

import { useState } from "react";
import { emptyPreferences } from "@/helpers/preferences";
import type { AccountActionResult, TravelPreferences } from "@/interfaces";
import { PreferenceSummary } from "./preference-summary";
import { PreferenceWizard } from "./preference-wizard";

interface PreferencesViewProps {
  /** null when the member has never saved preferences: the wizard opens straight away. */
  initial: TravelPreferences | null;
  onSave: (preferences: TravelPreferences) => Promise<AccountActionResult>;
}

const SAVE_ERRORS = {
  unauthenticated: "Your session has ended. Log in again to save your preferences.",
  unavailable: "Saving isn't available right now. Your choices are still here, so please try again in a few minutes.",
  invalid_input: "One of your choices couldn't be saved. Please review them and try again.",
} as const;

export function PreferencesView({ initial, onSave }: PreferencesViewProps) {
  const [saved, setSaved] = useState<TravelPreferences | null>(initial);
  const [editing, setEditing] = useState(initial === null);
  const [justSaved, setJustSaved] = useState(false);

  async function handleSave(preferences: TravelPreferences): Promise<string | null> {
    const result = await onSave(preferences);
    if (!result.ok) return SAVE_ERRORS[result.code];
    setSaved(preferences);
    setJustSaved(true);
    setEditing(false);
    return null;
  }

  if (editing || !saved) {
    return (
      <PreferenceWizard
        key={saved ? "edit" : "new"}
        initial={saved ?? emptyPreferences()}
        onSave={handleSave}
        onCancel={saved ? () => setEditing(false) : undefined}
      />
    );
  }
  return (
    <PreferenceSummary
      preferences={saved}
      justSaved={justSaved}
      onEdit={() => {
        setJustSaved(false);
        setEditing(true);
      }}
    />
  );
}
