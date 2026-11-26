import type { AuthProvider } from "./auth";
import type { ExperienceCardData, HotelCardData, PackageCardData } from "./home";

export type SignInMethod = "email" | AuthProvider;

export interface Account {
  id: string;
  firstName: string;
  email: string;
  signInMethod: SignInMethod;
}

export interface MemberTier {
  level: number;
  discountPercent: number;
  totalLevels: number;
  bookingsToNextLevel: number;
}

export interface AccountSummary {
  upcomingTrips: number;
  favoritesCount: number;
  tier: MemberTier;
}

export type BookingStatus = "confirmed" | "pending" | "cancelled";

/** ASSUMED shape: the prototype only shows the empty state. Align with the Trip Fusion booking payload later. */
export interface Booking {
  id: string;
  reference: string;
  title: string;
  location: string;
  /** ISO dates (YYYY-MM-DD). */
  startDate: string;
  endDate: string;
  status: BookingStatus;
  /** Pre-formatted, e.g. "$1,295". */
  total: string;
  href: string;
}

export type FavoriteKind = "experience" | "package" | "hotel";

export interface FavoriteRef {
  kind: FavoriteKind;
  id: string;
}

export type Favorite =
  | { id: string; kind: "experience"; item: ExperienceCardData }
  | { id: string; kind: "package"; item: PackageCardData }
  | { id: string; kind: "hotel"; item: HotelCardData };

export type PreferenceCategory = "experiences" | "regions" | "places" | "purpose" | "style";

/** Selected option ids per category. */
export type TravelPreferences = Record<PreferenceCategory, string[]>;

export interface ConnectedAccount {
  provider: AuthProvider;
  connected: boolean;
}

export interface NewsletterStatus {
  subscribed: boolean;
}

export interface AccountProfile {
  account: Account;
  newsletter: NewsletterStatus;
  connectedAccounts: ConnectedAccount[];
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type AccountActionError = "invalid_input" | "unauthenticated" | "unavailable";

export type PasswordChangeResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof PasswordChangeInput, string>>; code?: AccountActionError };

export type ResolveFavoritesResult = { ok: true; favorites: Favorite[] } | { ok: false; code: AccountActionError };

export type AccountActionResult = { ok: true } | { ok: false; code: AccountActionError };

/** Per-user account data. Mock today; Trip Fusion later. Methods throw NotSignedInError when there is no session. */
export interface IAccountService {
  getSummary(): Promise<AccountSummary>;
  listBookings(): Promise<Booking[]>;
  listFavorites(): Promise<Favorite[]>;
  /** Public card data for saved ids (the member's list itself lives in the browser until the API exists). Unknown ids are skipped. */
  resolveFavorites(refs: readonly FavoriteRef[]): Promise<Favorite[]>;
  /** null until the member has saved preferences at least once. */
  getPreferences(): Promise<TravelPreferences | null>;
  savePreferences(preferences: TravelPreferences): Promise<void>;
  getProfile(): Promise<AccountProfile>;
  setNewsletter(subscribed: boolean): Promise<void>;
  setConnectedAccount(provider: AuthProvider, connected: boolean): Promise<void>;
  changePassword(input: PasswordChangeInput): Promise<PasswordChangeResult>;
  addFavorite(ref: FavoriteRef): Promise<void>;
  removeFavorite(ref: FavoriteRef): Promise<void>;
}
