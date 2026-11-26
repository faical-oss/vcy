import { cookies } from "next/headers";
import { z } from "zod";
import { catalogFixture } from "@/mocks/fixtures/catalog";
import { homeFixture } from "@/mocks/fixtures/home";
import { PREFERENCE_CATEGORIES } from "@/constants/preferences";
import { validatePasswordChange } from "@/helpers/password-schema";
import { emptyPreferences } from "@/helpers/preferences";
import type {
  AccountProfile,
  AccountSummary,
  AuthProvider,
  Booking,
  Favorite,
  FavoriteRef,
  IAccountService,
  PasswordChangeInput,
  PasswordChangeResult,
  SignInMethod,
  TravelPreferences,
} from "@/interfaces";
import { NotSignedInError } from "@/lib/account-errors";
import { packageCardOf } from "../fixtures/catalog/package-detail-builder";
import { MockAuthInProductionError, mockAuthService } from "./auth.mock";

export const DEV_ACCOUNT_COOKIE = "vku_dev_account";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Defaults match the prototype: Wellness level 2, 10% discount, 9 bookings to level 3, no trips or favorites. */
const DEFAULT_TIER = { level: 2, discountPercent: 10, totalLevels: 3, bookingsToNextLevel: 9 } as const;

const preferencesSchema = z.object(
  Object.fromEntries(PREFERENCE_CATEGORIES.map(({ key }) => [key, z.array(z.string())])) as Record<string, z.ZodArray<z.ZodString>>,
);

const stateSchema = z.object({
  userId: z.string(),
  newsletter: z.boolean(),
  connected: z.object({ google: z.boolean(), apple: z.boolean(), facebook: z.boolean() }),
  preferences: preferencesSchema.nullable(),
  favorites: z.array(z.object({ kind: z.enum(["experience", "package", "hotel"]), id: z.string() })),
});
type DevAccountState = z.infer<typeof stateSchema>;

function defaults(userId: string): DevAccountState {
  return {
    userId,
    newsletter: true,
    connected: { google: false, apple: false, facebook: false },
    preferences: null,
    favorites: [],
  };
}

/** Same hard guard as the auth mock: dev only, checked before any cookie is touched. */
function assertDevOnly(): void {
  if (process.env.SITE_ENV === "production") throw new MockAuthInProductionError();
}

async function requireUser() {
  assertDevOnly();
  const session = await mockAuthService.getSession();
  if (!session) throw new NotSignedInError();
  return session;
}

/** State lives in an httpOnly dev cookie keyed by the session's user id, so it survives navigation and reloads. */
async function readState(userId: string): Promise<DevAccountState> {
  const raw = (await cookies()).get(DEV_ACCOUNT_COOKIE)?.value;
  if (!raw) return defaults(userId);
  try {
    const parsed = stateSchema.safeParse(JSON.parse(Buffer.from(raw, "base64url").toString("utf8")));
    return parsed.success && parsed.data.userId === userId ? parsed.data : defaults(userId);
  } catch {
    return defaults(userId);
  }
}

async function writeState(state: DevAccountState): Promise<void> {
  (await cookies()).set(DEV_ACCOUNT_COOKIE, Buffer.from(JSON.stringify(state)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

function signInMethodOf(userId: string): SignInMethod {
  const provider = (["google", "apple", "facebook"] as const).find((name) => userId === `dev-${name}`);
  return provider ?? "email";
}

function resolveFavorite(ref: FavoriteRef): Favorite | null {
  if (ref.kind === "experience") {
    // Every card of the catalog (Home's featured cards are catalog items too).
    const item = catalogFixture.experiences.find((entry) => entry.card.id === ref.id)?.card;
    return item ? { id: ref.id, kind: "experience", item } : null;
  }
  if (ref.kind === "package") {
    const item = homeFixture.packages.find((entry) => entry.id === ref.id) ?? packageCardOf(ref.id);
    return item ? { id: ref.id, kind: "package", item } : null;
  }
  const item = catalogFixture.hotels.find((entry) => entry.card.id === ref.id)?.card;
  return item ? { id: ref.id, kind: "hotel", item } : null;
}

const sameRef = (a: FavoriteRef, b: FavoriteRef) => a.kind === b.kind && a.id === b.id;

/** Dev-only account data. Nothing here is real: there are no bookings and passwords are never stored or verified. */
export const mockAccountService: IAccountService = {
  async getSummary(): Promise<AccountSummary> {
    const user = await requireUser();
    const state = await readState(user.userId);
    return { upcomingTrips: 0, favoritesCount: state.favorites.length, tier: { ...DEFAULT_TIER } };
  },

  async listBookings(): Promise<Booking[]> {
    await requireUser();
    return [];
  },

  async listFavorites(): Promise<Favorite[]> {
    const user = await requireUser();
    const state = await readState(user.userId);
    return state.favorites.flatMap((ref) => resolveFavorite(ref) ?? []);
  },

  async resolveFavorites(refs): Promise<Favorite[]> {
    await requireUser();
    return refs.flatMap((ref) => resolveFavorite(ref) ?? []);
  },

  async getPreferences(): Promise<TravelPreferences | null> {
    const user = await requireUser();
    const saved = (await readState(user.userId)).preferences;
    return saved ? { ...emptyPreferences(), ...saved } : null;
  },

  async savePreferences(preferences) {
    const user = await requireUser();
    const state = await readState(user.userId);
    await writeState({ ...state, preferences });
  },

  async getProfile(): Promise<AccountProfile> {
    const user = await requireUser();
    const state = await readState(user.userId);
    return {
      account: {
        id: user.userId,
        firstName: user.displayName.split(" ")[0] ?? user.displayName,
        email: user.email,
        signInMethod: signInMethodOf(user.userId),
      },
      newsletter: { subscribed: state.newsletter },
      connectedAccounts: (["google", "apple", "facebook"] as AuthProvider[]).map((provider) => ({
        provider,
        // Signing in with a provider means it is linked, whatever the dev flag says.
        connected: state.connected[provider] || signInMethodOf(user.userId) === provider,
      })),
    };
  },

  async setNewsletter(subscribed) {
    const user = await requireUser();
    await writeState({ ...(await readState(user.userId)), newsletter: subscribed });
  },

  /** DEV ONLY: flips a flag. No social account is actually linked. */
  async setConnectedAccount(provider, connected) {
    const user = await requireUser();
    const state = await readState(user.userId);
    await writeState({ ...state, connected: { ...state.connected, [provider]: connected } });
  },

  /** Validates the rules only. The mock has no stored password, so the current one cannot be checked. Never logs. */
  async changePassword(input: PasswordChangeInput): Promise<PasswordChangeResult> {
    await requireUser();
    return validatePasswordChange(input);
  },

  async addFavorite(ref) {
    const user = await requireUser();
    const state = await readState(user.userId);
    if (!resolveFavorite(ref) || state.favorites.some((entry) => sameRef(entry, ref))) return;
    await writeState({ ...state, favorites: [...state.favorites, ref] });
  },

  async removeFavorite(ref) {
    const user = await requireUser();
    const state = await readState(user.userId);
    await writeState({ ...state, favorites: state.favorites.filter((entry) => !sameRef(entry, ref)) });
  },
};
