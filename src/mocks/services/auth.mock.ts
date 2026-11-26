import { cookies } from "next/headers";
import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import type { AuthProvider, AuthResult, EmailAuthInput, IAuthService, ProviderAuthInput, Session } from "@/interfaces";

export const DEV_SESSION_COOKIE = "vku_dev_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const PROVIDER_LABEL: Record<AuthProvider, string> = { google: "Google", apple: "Apple", facebook: "Facebook" };

/** Thrown when the dev-only mock is used in a production environment. */
export class MockAuthInProductionError extends Error {
  constructor() {
    super('The mock auth service is dev-only and must never run with SITE_ENV="production". Disable USE_MOCKS or use a real IAuthService.');
    this.name = "MockAuthInProductionError";
  }
}

/** HARD GUARD: runs first in every method, before any cookie is read or written. */
function assertDevOnly(): void {
  if (process.env.SITE_ENV === "production") throw new MockAuthInProductionError();
}

const sessionSchema = z.object({ userId: z.string(), displayName: z.string(), email: z.string() });

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._+-]+/).filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Traveller";
}

function toCookieValue(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

function fromCookieValue(value: string): Session | null {
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function startSession(session: Session): Promise<AuthResult> {
  const store = await cookies();
  store.set(DEV_SESSION_COOKIE, toCookieValue(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return { ok: true, session };
}

/** Dev-only auth: any valid-looking email works and a fake session is stored in an httpOnly cookie. No real account is created. */
export const mockAuthService: IAuthService = {
  async getSession() {
    assertDevOnly();
    const value = (await cookies()).get(DEV_SESSION_COOKIE)?.value;
    return value ? fromCookieValue(value) : null;
  },

  /** Any valid email and any password of 8+ characters works. The password is checked for length only and never stored. */
  async continueWithEmail({ email, mode, firstName, password }: EmailAuthInput) {
    assertDevOnly();
    const normalized = email.trim().toLowerCase();
    if (!z.email().safeParse(normalized).success) return { ok: false, code: "invalid_email" };
    if ((password ?? "").length < MIN_PASSWORD_LENGTH) return { ok: false, code: "invalid_password" };
    const name = firstName?.trim();
    if (mode === "signup" && !name) return { ok: false, code: "invalid_name" };
    return startSession({
      userId: `dev-${normalized}`,
      displayName: mode === "signup" && name ? name : displayNameFromEmail(normalized),
      email: normalized,
    });
  },

  async continueWithProvider({ provider }: ProviderAuthInput) {
    assertDevOnly();
    return startSession({
      userId: `dev-${provider}`,
      displayName: `Dev login (${PROVIDER_LABEL[provider]})`,
      email: `dev-${provider}@example.test`,
    });
  },

  async signOut() {
    assertDevOnly();
    (await cookies()).delete(DEV_SESSION_COOKIE);
  },
};
