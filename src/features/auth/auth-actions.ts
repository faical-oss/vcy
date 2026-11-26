import type { AuthActions } from "@/interfaces";
import { continueWithEmailAction, continueWithProviderAction, signOutAction } from "./actions";

/** Server actions bundled for the client AuthProvider. */
export const authActions: AuthActions = {
  continueWithEmail: continueWithEmailAction,
  continueWithProvider: continueWithProviderAction,
  signOut: signOutAction,
};
