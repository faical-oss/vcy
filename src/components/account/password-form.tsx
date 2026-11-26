"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { cn } from "@/helpers/cn";
import { validatePasswordChange } from "@/helpers/password-schema";
import type { PasswordChangeInput, PasswordChangeResult } from "@/interfaces";

type Field = keyof PasswordChangeInput;

const FIELD_STYLE = "gap-2 [&_label]:text-xs [&_label]:uppercase [&_label]:tracking-label [&_input]:h-11 [&_input]:px-3";
const EMPTY: PasswordChangeInput = { currentPassword: "", newPassword: "", confirmPassword: "" };
const SERVER_ERRORS = {
  unauthenticated: "Your session has ended. Log in again to change your password.",
  unavailable: "Changing your password isn't available right now. Please try again in a few minutes.",
  invalid_input: "That didn't go through. Please check the fields and try again.",
} as const;

interface PasswordFormProps {
  onSubmit: (input: PasswordChangeInput) => Promise<PasswordChangeResult>;
  /** Called after a successful change so the card can collapse and confirm. */
  onDone: () => void;
  onCancel: () => void;
}

/** Inline change-password form. Validated on blur and submit (same rules as the server); passwords are never echoed or logged. */
export function PasswordForm({ onSubmit, onDone, onCancel }: PasswordFormProps) {
  const base = useId();
  const [values, setValues] = useState<PasswordChangeInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});

  const ids: Record<Field, string> = {
    currentPassword: `${base}-current`,
    newPassword: `${base}-new`,
    confirmPassword: `${base}-confirm`,
  };

  function validateField(field: Field, next: PasswordChangeInput) {
    // Only report a field once the member has typed in it (no errors on first open).
    if (!next[field]) return;
    const result = validatePasswordChange(next);
    setErrors((current) => ({ ...current, [field]: result.ok ? undefined : result.errors[field] }));
  }

  function handleChange(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Keep already-reported fields in sync while typing; the confirm field depends on the new password.
    if (touched[field] || errors[field]) validateField(field, next);
    if (field === "newPassword" && (touched.confirmPassword || errors.confirmPassword)) validateField("confirmPassword", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const checked = validatePasswordChange(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      const first = (Object.keys(ids) as Field[]).find((field) => checked.errors[field]);
      if (first) document.getElementById(ids[first])?.focus();
      return;
    }
    setPending(true);
    const result = await onSubmit(values);
    setPending(false);
    if (result.ok) {
      setValues(EMPTY);
      onDone();
      return;
    }
    setErrors(result.errors);
    if (result.code) setFormError(SERVER_ERRORS[result.code]);
  }

  const bind = (field: Field) => ({
    id: ids[field],
    name: field,
    type: "password" as const,
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => handleChange(field, event.target.value),
    onBlur: () => {
      setTouched((current) => ({ ...current, [field]: true }));
      validateField(field, values);
    },
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${ids[field]}-error` : undefined,
  });

  const fieldError = (field: Field) =>
    errors[field] ? (
      <p id={`${ids[field]}-error`} role="alert" className="mt-2 text-xs text-error">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 border-t border-border pt-5">
      <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label="Current password"
          srOnlyLabel={false}
          autoComplete="current-password"
          className={cn(FIELD_STYLE, errors.currentPassword && "[&_input]:border-error")}
          {...bind("currentPassword")}
        />
        {fieldError("currentPassword")}
      </div>
      <div>
        <Input
          label="New password"
          srOnlyLabel={false}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          className={cn(FIELD_STYLE, errors.newPassword && "[&_input]:border-error")}
          {...bind("newPassword")}
        />
        {fieldError("newPassword")}
      </div>
      <div>
        <Input
          label="Confirm new password"
          srOnlyLabel={false}
          autoComplete="new-password"
          placeholder="Re-enter new password"
          className={cn(FIELD_STYLE, errors.confirmPassword && "[&_input]:border-error")}
          {...bind("confirmPassword")}
        />
        {fieldError("confirmPassword")}
      </div>
      </div>
      {formError ? (
        <p role="alert" className="mt-4 text-xs text-error">
          {formError}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" className="h-9 w-full border-primary px-4 text-sm font-medium normal-case tracking-normal text-primary sm:w-auto" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="h-9 w-full px-4 text-sm uppercase tracking-label sm:w-auto" disabled={pending} aria-busy={pending}>
          Update password
        </Button>
      </div>
    </form>
  );
}
