"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { AuthActions, AuthMode, Session } from "@/interfaces";
import { AuthModal } from "./auth-modal";

interface AuthContextValue {
  session: Session | null;
  /** Opens the sign-in / create-account dialog. Pass the clicked element so focus returns to it on close; `afterSignIn` is a path to go to once signed in. */
  openAuth: (mode?: AuthMode, opener?: HTMLElement | null, afterSignIn?: string) => void;
  signOut: () => Promise<void>;
}

type AuthControls = Omit<AuthContextValue, "session">;

const AuthContext = createContext<AuthControls | null>(null);
const SessionContext = createContext<Session | null>(null);

/**
 * Supplies the session to its subtree. Kept separate from AuthProvider because reading the session cookie is
 * request-time work: only the header (inside <Suspense>) needs it, so the rest of the page can stay static.
 */
export function SessionProvider({ session, children }: { session: Session | null; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const controls = useContext(AuthContext);
  const session = useContext(SessionContext);
  if (!controls) throw new Error("useAuth must be used inside <AuthProvider>");
  return { ...controls, session };
}

interface AuthProviderProps {
  actions: AuthActions;
  /** True when sign-in is the dev-only mock: the modal then says no real account is created. */
  devNotice: boolean;
  children: ReactNode;
}

/** Holds the modal's open state and the auth actions for the header, mobile menu and account page. */
export function AuthProvider({ actions, devNotice, children }: AuthProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const openerRef = useRef<HTMLElement | null>(null);

  const afterSignInRef = useRef<string | null>(null);

  const openAuth = useCallback((nextMode: AuthMode = "login", opener?: HTMLElement | null, afterSignIn?: string) => {
    openerRef.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    afterSignInRef.current = afterSignIn ?? null;
    setMode(nextMode);
    setOpen(true);
  }, []);

  /** The dialog has no <Dialog.Trigger>, so hand focus back to whatever opened it. */
  const restoreFocus = useCallback((event: Event) => {
    const opener = openerRef.current;
    if (opener?.isConnected) {
      event.preventDefault();
      opener.focus();
    }
  }, []);

  /** The server action clears the cookie and redirects to Home, so there is nothing to navigate to here. */
  const signOut = useCallback(async () => {
    await actions.signOut();
  }, [actions]);

  const value = useMemo(() => ({ openAuth, signOut }), [openAuth, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        onModeChange={setMode}
        onCloseAutoFocus={restoreFocus}
        devNotice={devNotice}
        actions={actions}
        onSignedIn={() => {
          setOpen(false);
          const destination = afterSignInRef.current;
          afterSignInRef.current = null;
          if (destination) router.push(destination);
          else router.refresh();
        }}
      />
    </AuthContext.Provider>
  );
}
