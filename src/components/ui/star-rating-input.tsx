"use client";

import { Star } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/helpers/cn";

/** Text of each value, "Poor" to "Excellent". */
export const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"] as const;

interface StarRatingInputProps {
  /** Form field name of the radio group. */
  name: string;
  /** Visible label of the group. */
  label: string;
  /** 0 = nothing chosen yet. */
  value: number;
  onChange: (value: number) => void;
  /** Focus left the whole group (not just moved to another star). */
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  /** Error message; sets `aria-invalid` and is announced with the group. */
  error?: string;
  className?: string;
}

/**
 * A five-star rating as a native radio group: click or tap to choose, hover (mouse) to preview, arrow keys change the value,
 * Space or Enter choose the focused star (Enter does not submit the form from a star). Each star is a 44px target. The text
 * under the stars names the previewed or chosen value ("Poor" to "Excellent"). The first radio gets focus from the form when
 * the value is missing (`data-rating-first`).
 */
export function StarRatingInput({ name, label, value, onChange, onBlur, required, disabled, error, className }: StarRatingInputProps) {
  const labelId = useId();
  const errorId = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, star: number) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onChange(star);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1" onMouseLeave={() => setHover(0)}>
        <p id={labelId} className="text-base leading-6 text-primary">
          {label}
        </p>
        {/* The stars and what they say are one group: on one line when they fit, under a long label rather than over it, and the text under the stars (never over them) when 44px touch stars fill the line (320px). */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div role="radiogroup" aria-labelledby={labelId} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className="flex items-center">
          {RATING_LABELS.map((text, index) => {
            const star = index + 1;
            return (
              <label key={star} onMouseEnter={() => setHover(star)} className={cn("flex size-6 items-center justify-center pointer-coarse:size-11", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
                <input
                  type="radio"
                  name={name}
                  value={star}
                  checked={value === star}
                  disabled={disabled}
                  onChange={() => onChange(star)}
                  onKeyDown={(event) => onKeyDown(event, star)}
                  onBlur={(event) => {
                    if (!event.currentTarget.closest('[role="radiogroup"]')?.contains(event.relatedTarget as Node | null)) onBlur?.();
                  }}
                  data-rating-first={star === 1 ? "" : undefined}
                  className="peer sr-only"
                />
                <span className="sr-only">
                  {star} out of 5, {text}
                </span>
                <Star aria-hidden className={cn("size-[18px] rounded-sm transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent", star <= shown ? "fill-star text-star" : "text-border-strong")} />
              </label>
            );
          })}
        </div>
        <p aria-hidden className="text-base leading-6 text-primary">
          {shown ? RATING_LABELS[shown - 1] : null}
        </p>
        </div>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
