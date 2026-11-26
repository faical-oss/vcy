import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { AccountNav } from "./account-nav";

interface AccountShellProps {
  /** Welcome band content (avatar, title, pill). Streamed separately so the frame and nav never wait for it. */
  identity: ReactNode;
  children: ReactNode;
}

/** Static frame for every account route: welcome band, navigation (sidebar from lg) and the view. Matches the prototype's shell. */
// overflow-x-clip, not hidden: hidden would make this the scroll container and break the sticky sidebar.
export function AccountShell({ identity, children }: AccountShellProps) {
  return (
    <div className="overflow-x-clip bg-surface">
      <header className="border-b border-border-soft bg-surface-blue text-primary">
        <Container className="flex flex-wrap items-center gap-x-4 gap-y-5 py-8 sm:flex-nowrap sm:gap-5 sm:py-14">{identity}</Container>
      </header>

      <Container className="grid grid-cols-[minmax(0,1fr)] gap-5 py-5 sm:gap-6 sm:py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-12">
        <aside className="lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
