"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { StarRatingInput } from "@/components/ui/star-rating-input";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/constants/reviews";
import type { ReviewFormState } from "@/interfaces";

type ReviewAction = (previous: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;

const MESSAGES = {
  disabled: "Reviews cannot be submitted right now.",
  unavailable: "We could not send your review. Please try again in a moment.",
  rate_limited: "You have sent several reviews already. Please try again later.",
  invalid_input: "Please check the highlighted fields.",
} as const;

const SUCCESS = "Thanks, your review will appear after moderation.";
const IDLE: ReviewFormState = { status: "idle" };

type Field = "rating" | "text";
type Errors = Partial<Record<Field, string>>;

/** The checks the form runs in the browser (the server action repeats them). */
function validate(rating: number, text: string): Errors {
  const errors: Errors = {};
  if (rating < 1) errors.rating = "Choose a rating from 1 to 5.";
  const length = text.trim().length;
  if (length === 0) errors.text = "Tell us about your experience.";
  else if (length < REVIEW_TEXT_MIN) errors.text = `Write at least ${REVIEW_TEXT_MIN} characters (${length} so far).`;
  return errors;
}

/** The dev-only `?mock=` of the page, so the mock review service can be told to succeed or fail. Empty on the server. */
const subscribeNever = () => () => {};
const readMock = () => new URLSearchParams(window.location.search).get("mock") ?? "";

/**
 * "Travelled on this trip?": star rating (required), review text (20 to 2000 characters, with a counter; the optional title field of the first rebuild was dropped to keep the original design),
 * shared by the hotel and the experience page. Anyone can send a review (no login), like the form before it. Inline errors
 * show on blur and on submit and focus moves to the first invalid field; while sending the form is disabled; on success a
 * thank-you replaces it (a submitted review is never added to the list); on failure the input stays and "Try again" resends it.
 */
export function ReviewForm({ hotelSlug, action }: { hotelSlug: string; action: ReviewAction }) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const sending = useRef(false);
  const mock = useSyncExternalStore(subscribeNever, readMock, () => "");

  useEffect(() => {
    if (!pending) sending.current = false;
  }, [pending]);

  const clientErrors = validate(rating, text);
  const serverErrors = state.status === "error" ? state.fieldErrors : undefined;
  const shown = (field: Field) => (submitted || touched[field] ? clientErrors[field] : undefined);
  const ratingError = shown("rating") ?? serverErrors?.rating;
  const textError = shown("text") ?? serverErrors?.text;

  function send() {
    if (sending.current || pending) return;
    sending.current = true;
    const data = new FormData();
    data.set("hotelSlug", hotelSlug);
    data.set("rating", String(rating));
    data.set("text", text);
    if (mock) data.set("mock", mock);
    startTransition(() => dispatch(data));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const errors = validate(rating, text);
    if (errors.rating) return formRef.current?.querySelector<HTMLInputElement>("input[data-rating-first]")?.focus();
    if (errors.text) return textRef.current?.focus();
    send();
  }

  const failed = state.status === "error" && state.code !== "invalid_input" ? MESSAGES[state.code] : null;
  const announcement = pending ? "Sending your review…" : state.status === "success" ? SUCCESS : failed ?? "";

  return (
    <div>
      {state.status === "success" ? (
        <p className="flex items-center gap-3 rounded-card bg-success px-5 py-4 text-base font-medium text-white">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden />
          {SUCCESS}
        </p>
      ) : (
        <form ref={formRef} onSubmit={onSubmit} aria-busy={pending} className="border border-border p-6" noValidate>
          <fieldset disabled={pending} className="min-w-0 space-y-4">
            <legend className="sr-only">Write a review</legend>
            <div>
              <h3 className="font-display text-title-sm font-medium text-primary">Travelled on this trip?</h3>
              <p className="mt-1 text-base text-body">Share your experience and help others make the right choice.</p>
            </div>

            <StarRatingInput name="rating" label="Your rating:" value={rating} onChange={setRating} onBlur={() => setTouched((previous) => ({ ...previous, rating: true }))} required disabled={pending} error={ratingError} />

            <div>
              <Textarea
                ref={textRef}
                name="text"
                label="Your review"
                srOnlyLabel
                value={text}
                rows={5}
                maxLength={REVIEW_TEXT_MAX}
                required
                aria-required
                aria-invalid={textError ? true : undefined}
                aria-describedby={`review-text-count${textError ? " review-text-error" : ""}`}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => setTouched((previous) => ({ ...previous, text: true }))}
                placeholder="Tell us about your experience…"
                className="[&>textarea]:min-h-32 [&>textarea]:rounded-none [&>textarea]:text-base"
              />
              <div className="mt-1.5 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                {textError ? (
                  <p id="review-text-error" role="alert" className="text-sm text-error">
                    {textError}
                  </p>
                ) : (
                  <span />
                )}
                <p id="review-text-count" className="ml-auto text-sm text-body">
                  {text.length} / {REVIEW_TEXT_MAX}
                  {text.trim().length < REVIEW_TEXT_MIN ? ` · at least ${REVIEW_TEXT_MIN}` : ""}
                </p>
              </div>
            </div>

            {failed ? <p className="text-base text-error">{failed}</p> : null}

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="md" className="px-8" aria-disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Sending…
                  </>
                ) : (
                  "Submit review"
                )}
              </Button>
              {failed && !pending ? (
                <Button type="button" variant="link" size="inline" onClick={send}>
                  Try again
                </Button>
              ) : null}
            </div>
          </fieldset>
        </form>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
