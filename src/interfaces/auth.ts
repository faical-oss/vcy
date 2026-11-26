export type AuthMode = "login" | "signup";
export type AuthProvider = "google" | "apple" | "facebook";

export interface Session {
  userId: string;
  displayName: string;
  email: string;
}

export interface EmailAuthInput {
  email: string;
  mode: AuthMode;
  /** Second step of the form. Required for sign-up (first name) and for both modes (password, at least 8 characters). */
  firstName?: string;
  password?: string;
  /** Sign-up only: the "Travel inspiration" checkbox. */
  subscribeToNewsletter?: boolean;
}

export interface ProviderAuthInput {
  provider: AuthProvider;
  mode: AuthMode;
}

export type AuthErrorCode = "invalid_email" | "invalid_password" | "invalid_name" | "invalid_input" | "unavailable";

export type AuthResult = { ok: true; session: Session } | { ok: false; code: AuthErrorCode };

/** Email-first auth (email, then password and first name on sign-up) plus social providers. The real implementation is not chosen yet; see src/services/index.ts. */
export interface IAuthService {
  getSession(): Promise<Session | null>;
  continueWithEmail(input: EmailAuthInput): Promise<AuthResult>;
  continueWithProvider(input: ProviderAuthInput): Promise<AuthResult>;
  signOut(): Promise<void>;
}

/** What the client UI may call (implemented by server actions in src/features/auth/actions.ts). */
export interface AuthActions {
  continueWithEmail(input: EmailAuthInput): Promise<AuthResult>;
  continueWithProvider(input: ProviderAuthInput): Promise<AuthResult>;
  signOut(): Promise<void>;
}
