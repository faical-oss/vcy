"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Apple, ArrowLeft, Check, CircleHelp, Gift, LockKeyhole, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/helpers/cn";
import { looksLikeEmail } from "@/helpers/email";
import type { AuthActions, AuthErrorCode, AuthMode, AuthProvider, AuthResult } from "@/interfaces";

const PERKS = [
  { label: "Member-only offers", Icon: Gift },
  { label: "Save favorites", Icon: Check },
  { label: "Expert support", Icon: CircleHelp },
] as const;

const COPY = {
  login: { title: "Welcome back", description: "Log in to continue to your selected trip." },
  signup: { title: "Join Vacayou", description: "Create your free account to continue and unlock member benefits." },
} as const satisfies Record<AuthMode, { title: string; description: string }>;

const PROVIDERS: readonly { id: AuthProvider; label: string; icon: ReactNode }[] = [
  { id: "google", label: "Google", icon: <span className="font-bold text-brand-google">G</span> },
  { id: "apple", label: "Apple", icon: <Apple aria-hidden className="size-4" /> },
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <span className="flex size-4 items-center justify-center rounded-full bg-brand-facebook text-xs font-bold lowercase leading-none text-white">
        f
      </span>
    ),
  },
];

/** Plain-language messages with a way forward; none of them blames the user. */
const EMAIL_ERRORS = {
  empty: "Add your email address so we can continue.",
  invalid: "This email looks incomplete. Check for a missing @ or domain, then try again.",
} as const;
const NAME_ERROR = "Add your first name so we can finish setting up your account.";
const PASSWORD_ERROR = `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
const SERVER_ERRORS: Record<AuthErrorCode, string> = {
  invalid_email: EMAIL_ERRORS.invalid,
  invalid_name: NAME_ERROR,
  invalid_password: PASSWORD_ERROR,
  invalid_input: "Something in that request didn't go through. Please try again.",
  unavailable: "Signing in isn't available right now. Please try again in a few minutes.",
};

/** Figma fields: 44px tall, 12px uppercase labels. Applied to the shared Input without changing it. */
const FIELD_STYLE =
  "gap-2 [&_label]:text-xs [&_label]:uppercase [&_label]:tracking-label [&_input]:h-11 [&_input]:px-3";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  /** Lets the parent return focus to the element that opened the dialog. */
  onCloseAutoFocus: (event: Event) => void;
  /** Show the "Dev login" notice (mock auth is active). */
  devNotice: boolean;
  actions: Pick<AuthActions, "continueWithEmail" | "continueWithProvider">;
  /** Called after a successful sign-in so the page can refresh the session. */
  onSignedIn: () => void;
}

export function AuthModal({ open, onOpenChange, mode, onModeChange, onCloseAutoFocus, devNotice, actions, onSignedIn }: AuthModalProps) {
  const baseId = useId();
  const emailId = `${baseId}-email`;
  const nameId = `${baseId}-name`;
  const passwordId = `${baseId}-password`;
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; firstName?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [subscribe, setSubscribe] = useState(true);
  const [pending, startTransition] = useTransition();

  const validators = {
    email: (value: string) => (!value.trim() ? EMAIL_ERRORS.empty : looksLikeEmail(value) ? undefined : EMAIL_ERRORS.invalid),
    firstName: (value: string) => (mode === "signup" && !value.trim() ? NAME_ERROR : undefined),
    password: (value: string) => (value.length < MIN_PASSWORD_LENGTH ? PASSWORD_ERROR : undefined),
  };

  function setError(field: keyof typeof errors, message: string | undefined) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function resetForm() {
    setStep("email");
    setPassword("");
    setFirstName("");
    setErrors({});
    setFormError(null);
  }

  function handleResult(result: AuthResult) {
    if (result.ok) {
      setEmail("");
      resetForm();
      onSignedIn();
    } else if (result.code === "invalid_email") {
      setStep("email");
      setError("email", SERVER_ERRORS.invalid_email);
    } else if (result.code === "invalid_name") {
      setError("firstName", NAME_ERROR);
    } else if (result.code === "invalid_password") {
      setError("password", PASSWORD_ERROR);
    } else {
      setFormError(SERVER_ERRORS[result.code]);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (step === "email") {
      const error = validators.email(email);
      setError("email", error);
      if (!error) setStep("details");
      return;
    }

    const next = { firstName: validators.firstName(firstName), password: validators.password(password) };
    setErrors((current) => ({ ...current, ...next }));
    if (next.firstName || next.password) return;
    startTransition(async () => {
      handleResult(
        await actions.continueWithEmail({
          email: email.trim(),
          mode,
          firstName: mode === "signup" ? firstName.trim() : undefined,
          password,
          subscribeToNewsletter: mode === "signup" ? subscribe : undefined,
        }),
      );
    });
  }

  function handleProvider(provider: AuthProvider) {
    setFormError(null);
    startTransition(async () => {
      handleResult(await actions.continueWithProvider({ provider, mode }));
    });
  }

  const copy = COPY[mode];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-scrim" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[80] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-input bg-card shadow-2xl focus:outline-none"
          aria-describedby="auth-modal-description"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <Dialog.Close
            aria-label="Close account dialog"
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
          >
            <X aria-hidden className="size-6" />
          </Dialog.Close>

          <div className="bg-primary px-6 py-7 text-white sm:px-8">
            <Logo className="text-white" />
            <Dialog.Title className="mt-6 font-display text-title-md font-medium">Your journey starts here</Dialog.Title>
            <Dialog.Description id="auth-modal-description" className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
              Sign in or create an account to explore handpicked wellness travel and exclusive member benefits.
            </Dialog.Description>
            <ul className="mt-5 grid gap-2 text-xs text-white/85 sm:grid-cols-3">
              {PERKS.map(({ label, Icon }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon aria-hidden className="size-[15px] text-accent" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-8">
            {devNotice ? (
              <p role="note" className="mb-6 rounded-input border border-dashed border-accent bg-surface px-3 py-2 text-xs text-body">
                Dev login: no real account is created
              </p>
            ) : null}

            <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 rounded-full bg-surface p-1">
              {(["login", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab}
                  onClick={() => {
                    onModeChange(tab);
                    resetForm();
                  }}
                  className={cn(
                    "h-9 min-w-0 whitespace-nowrap rounded-full px-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors sm:px-4 sm:text-xs sm:tracking-widest",
                    mode === tab ? "bg-card text-primary shadow-sm" : "text-body hover:text-primary",
                  )}
                >
                  {tab === "login" ? "Log in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="mb-6 text-left">
              <h3 className="font-display text-heading-sm font-medium leading-8 text-primary">{copy.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{copy.description}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {step === "email" ? (
                <Input
                  id={emailId}
                  label="Email address"
                  srOnlyLabel={false}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setError("email", validators.email(email))}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? `${emailId}-error` : undefined}
                  className={cn(FIELD_STYLE, errors.email && "[&_input]:border-error")}
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetForm();
                    }}
                    className="-ml-3 mb-4 justify-start border-transparent bg-transparent px-3 text-xs tracking-label text-body hover:bg-transparent hover:text-primary"
                  >
                    <ArrowLeft aria-hidden className="size-4" />
                    Change email
                  </Button>
                  <p className="mb-4 rounded-input bg-surface px-3 py-2 text-sm text-body">{email.trim()}</p>
                  <div className="space-y-4">
                    {mode === "signup" ? (
                      <div>
                        <Input
                          id={nameId}
                          label="First name"
                          srOnlyLabel={false}
                          name="firstName"
                          autoComplete="given-name"
                          placeholder="Your first name"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          onBlur={() => setError("firstName", validators.firstName(firstName))}
                          aria-invalid={errors.firstName ? true : undefined}
                          aria-describedby={errors.firstName ? `${nameId}-error` : undefined}
                          className={cn(FIELD_STYLE, errors.firstName && "[&_input]:border-error")}
                        />
                        {errors.firstName ? (
                          <p id={`${nameId}-error`} role="alert" className="mt-2 text-xs text-error">
                            {errors.firstName}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div>
                      <div className="relative">
                        <Input
                          id={passwordId}
                          label="Password"
                          srOnlyLabel={false}
                          name="password"
                          type="password"
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          onBlur={() => setError("password", validators.password(password))}
                          aria-invalid={errors.password ? true : undefined}
                          aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                          className={cn(FIELD_STYLE, "[&_input]:pr-10", errors.password && "[&_input]:border-error")}
                        />
                        <LockKeyhole aria-hidden className="pointer-events-none absolute bottom-[14.5px] right-3 size-[15px] text-muted-blue" />
                        {mode === "login" ? (
                          <button
                            type="button"
                            // TODO: wire to the password-reset flow once the real auth provider is chosen (the prototype's button does nothing visible).
                            onClick={() => undefined}
                            className="absolute right-0 top-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Forgot password?
                          </button>
                        ) : null}
                      </div>
                      {errors.password ? (
                        <p id={`${passwordId}-error`} role="alert" className="mt-2 text-xs text-error">
                          {errors.password}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
              {step === "email" && errors.email ? (
                <p id={`${emailId}-error`} role="alert" className="mt-2 text-xs text-error">
                  {errors.email}
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="mt-5 w-full uppercase tracking-cta">
                {step === "email" ? "Continue" : mode === "signup" ? "Create account" : "Log in"}
              </Button>
              {formError ? (
                <p role="alert" className="mt-3 text-xs text-error">
                  {formError}
                </p>
              ) : null}
            </form>

            <div className="my-6 flex items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-border" />
              <span className="text-micro font-semibold uppercase tracking-caption text-muted-blue">Or continue with</span>
              <span aria-hidden className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {PROVIDERS.map(({ id, label, icon }) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleProvider(id)}
                  className="border-muted-blue px-4 text-xs tracking-label"
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>

            {mode === "signup" ? (
              <Checkbox
                className="mt-5"
                label="Travel inspiration"
                description="Send me curated retreats, destination ideas and occasional member offers."
                status={subscribe ? "Subscribed" : "Not subscribed"}
                checked={subscribe}
                onChange={(event) => setSubscribe(event.target.checked)}
              />
            ) : null}

            <p className="mt-6 flex items-start gap-2 text-caption leading-relaxed text-body">
              <ShieldCheck aria-hidden className="mt-0.5 size-[15px] shrink-0 text-muted-blue" />
              <span>
                By continuing, you agree to our{" "}
                <Link
                  href={ROUTES.terms}
                  onClick={() => onOpenChange(false)}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Terms of Use
                </Link>{" "}
                and acknowledge our{" "}
                <Link
                  href={ROUTES.privacy}
                  onClick={() => onOpenChange(false)}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
