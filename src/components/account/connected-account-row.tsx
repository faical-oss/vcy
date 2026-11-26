import { ProviderIcon } from "@/components/auth/provider-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/cn";
import type { AuthProvider } from "@/interfaces";

const LABEL: Record<AuthProvider, string> = { google: "Google", apple: "Apple", facebook: "Facebook" };

interface ConnectedAccountRowProps {
  provider: AuthProvider;
  connected: boolean;
  pending: boolean;
  /** The provider the member signed in with: always connected, so it cannot be disconnected here. */
  isSignInMethod?: boolean;
  onToggle: () => void;
}

export function ConnectedAccountRow({ provider, connected, pending, isSignInMethod = false, onToggle }: ConnectedAccountRowProps) {
  const name = LABEL[provider];
  return (
    <li className="flex items-center gap-3 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-base text-primary">
        <ProviderIcon provider={provider} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary">{name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-body">
          <span aria-hidden className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-muted-blue")} />
          {connected ? "Connected" : "Not connected"}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending || (isSignInMethod && connected)}
        onClick={onToggle}
        aria-label={`${connected ? "Disconnect" : "Connect"} ${name}`}
        className="border-primary px-4 text-sm font-medium normal-case tracking-normal text-primary"
      >
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </li>
  );
}
