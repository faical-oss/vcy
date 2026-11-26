"use client";

import { Bell, Link2, LockKeyhole, Settings } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type {
  AccountActionResult,
  AccountProfile,
  AuthProvider,
  PasswordChangeInput,
  PasswordChangeResult,
  SignInMethod,
} from "@/interfaces";
import { ConnectedAccountRow } from "./connected-account-row";
import { PasswordForm } from "./password-form";

const METHOD_LABEL: Record<SignInMethod, string> = { email: "Email", google: "Google", apple: "Apple", facebook: "Facebook" };

interface ProfileViewProps {
  profile: AccountProfile;
  onNewsletterChange: (subscribed: boolean) => Promise<AccountActionResult>;
  /** DEV ONLY while the mock is active: flips a flag, links nothing. */
  onConnectedChange: (input: { provider: AuthProvider; connected: boolean }) => Promise<AccountActionResult>;
  onChangePassword: (input: PasswordChangeInput) => Promise<PasswordChangeResult>;
}

const FIELD_LABEL = "text-micro font-semibold uppercase tracking-widest text-muted-blue";
const INNER_CARD = "mt-4 rounded-card border border-border p-4 sm:mt-6 sm:p-5";

export function ProfileView({ profile, onNewsletterChange, onConnectedChange, onChangePassword }: ProfileViewProps) {
  const { account } = profile;
  const newsletterLabelId = useId();
  const [subscribed, setSubscribed] = useState(profile.newsletter.subscribed);
  const [newsletterPending, setNewsletterPending] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [connected, setConnected] = useState(() => Object.fromEntries(profile.connectedAccounts.map((entry) => [entry.provider, entry.connected])) as Record<AuthProvider, boolean>);
  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  async function toggleNewsletter(next: boolean) {
    setNewsletterError(null);
    setSubscribed(next);
    setNewsletterPending(true);
    const result = await onNewsletterChange(next);
    setNewsletterPending(false);
    if (!result.ok) {
      setSubscribed(!next);
      setNewsletterError("We couldn't update your subscription. Please try again in a moment.");
    }
  }

  async function toggleProvider(provider: AuthProvider) {
    const next = !connected[provider];
    setConnectError(null);
    setPendingProvider(provider);
    const result = await onConnectedChange({ provider, connected: next });
    setPendingProvider(null);
    if (result.ok) setConnected((current) => ({ ...current, [provider]: next }));
    else setConnectError("We couldn't update that connection. Please try again in a moment.");
  }

  return (
    <section aria-labelledby="profile-title" className="rounded-card bg-card p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="profile-title" className="font-display text-heading-xs font-medium text-primary sm:text-heading">
            Profile details
          </h2>
          <p className="mt-1 text-sm text-body">Manage your personal details and communication preferences.</p>
        </div>
        <Settings aria-hidden className="size-6 shrink-0 text-accent" />
      </div>

      {/* First name, email and sign-in method are read-only on purpose: the prototype does not let members edit them. */}
      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
        <dl className="rounded-card bg-surface p-4">
          <dt className={FIELD_LABEL}>First name</dt>
          <dd className="mt-1 text-sm font-medium text-primary">{account.firstName}</dd>
        </dl>
        <dl className="rounded-card bg-surface p-4">
          <dt className={FIELD_LABEL}>Email address</dt>
          <dd className="mt-1 truncate text-sm font-medium text-primary">{account.email}</dd>
        </dl>
        <dl className="rounded-card bg-surface p-4">
          <dt className={FIELD_LABEL}>Sign-in method</dt>
          <dd className="mt-1 text-sm font-medium text-primary">{METHOD_LABEL[account.signInMethod]}</dd>
        </dl>
        <div className="flex min-h-16 items-center gap-3 rounded-card bg-surface p-4">
          <Bell aria-hidden className="size-6 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p id={newsletterLabelId} className={FIELD_LABEL}>
              Travel inspiration
            </p>
            <p aria-live="polite" className="mt-1 text-sm font-medium text-primary">
              {subscribed ? "Subscribed" : "Not subscribed"}
            </p>
          </div>
          <Switch checked={subscribed} onCheckedChange={toggleNewsletter} disabled={newsletterPending} aria-labelledby={newsletterLabelId} />
        </div>
      </div>
      {newsletterError ? (
        <p role="alert" className="mt-3 text-xs text-error">
          {newsletterError}
        </p>
      ) : null}

      <div className={INNER_CARD}>
        <div className="flex items-start gap-3">
          <Link2 aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
          <div>
            <h3 className="text-sm font-semibold text-primary">Connected accounts</h3>
            <p className="mt-1 text-sm leading-relaxed text-body">Connect a social account for another secure way to sign in.</p>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {(["google", "apple", "facebook"] as const).map((provider) => (
            <ConnectedAccountRow
              key={provider}
              provider={provider}
              connected={connected[provider]}
              pending={pendingProvider === provider}
              isSignInMethod={account.signInMethod === provider}
              onToggle={() => toggleProvider(provider)}
            />
          ))}
        </ul>
        {connectError ? (
          <p role="alert" className="mt-3 text-xs text-error">
            {connectError}
          </p>
        ) : null}
      </div>

      <div className={INNER_CARD}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LockKeyhole aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
            <div>
              <h3 className="text-sm font-semibold text-primary">Password</h3>
              <p className="mt-1 text-sm leading-relaxed text-body">Use a unique password with at least eight characters.</p>
            </div>
          </div>
          {!changingPassword ? (
            <Button
              variant="outline"
              className="h-9 w-full border-primary px-4 text-sm font-semibold uppercase tracking-label text-primary sm:w-auto"
              onClick={() => {
                setPasswordUpdated(false);
                setChangingPassword(true);
              }}
            >
              Change password
            </Button>
          ) : null}
        </div>
        {passwordUpdated && !changingPassword ? (
          <p role="status" className="mt-4 text-sm font-medium text-primary">
            Your password has been updated.
          </p>
        ) : null}
        {changingPassword ? (
          <PasswordForm
            onSubmit={onChangePassword}
            onDone={() => {
              setChangingPassword(false);
              setPasswordUpdated(true);
            }}
            onCancel={() => setChangingPassword(false)}
          />
        ) : null}
      </div>
    </section>
  );
}
