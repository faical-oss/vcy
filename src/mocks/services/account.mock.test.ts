import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const cookieStore = {
  get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
  set: (name: string, value: string) => void store.set(name, value),
  delete: (name: string) => void store.delete(name),
};
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

import { catalogFixture } from "@/mocks/fixtures/catalog";
import { emptyPreferences } from "@/helpers/preferences";
import { NotSignedInError } from "@/lib/account-errors";
import { mockAccountService } from "./account.mock";
import { MockAuthInProductionError, mockAuthService } from "./auth.mock";

async function signIn(email = "jane.doe@example.com") {
  await mockAuthService.continueWithEmail({ email, mode: "login", password: "password1" });
}

describe("mockAccountService", () => {
  beforeEach(() => vi.stubEnv("SITE_ENV", "development"));
  afterEach(() => {
    vi.unstubAllEnvs();
    store.clear();
  });

  it("resolves a favorite for every experience and hotel card of the catalog, not only Home's", async () => {
    await signIn();
    const refs = [
      ...catalogFixture.experiences.map(({ card }) => ({ kind: "experience" as const, id: card.id })),
      ...catalogFixture.hotels.map(({ card }) => ({ kind: "hotel" as const, id: card.id })),
    ];
    expect(await mockAccountService.resolveFavorites(refs)).toHaveLength(refs.length);
  });

  it("requires a session", async () => {
    await expect(mockAccountService.getSummary()).rejects.toThrow(NotSignedInError);
    await expect(mockAccountService.savePreferences(emptyPreferences())).rejects.toThrow(NotSignedInError);
  });

  it("returns the prototype defaults", async () => {
    await signIn();
    expect(await mockAccountService.getSummary()).toEqual({
      upcomingTrips: 0,
      favoritesCount: 0,
      tier: { level: 2, discountPercent: 10, totalLevels: 3, bookingsToNextLevel: 9 },
    });
    expect(await mockAccountService.listBookings()).toEqual([]);
    expect(await mockAccountService.getPreferences()).toBeNull();
    const profile = await mockAccountService.getProfile();
    expect(profile.account).toMatchObject({ firstName: "Jane", email: "jane.doe@example.com", signInMethod: "email" });
    expect(profile.newsletter.subscribed).toBe(true);
    expect(profile.connectedAccounts.every((entry) => !entry.connected)).toBe(true);
  });

  it("round-trips preferences, even an empty selection", async () => {
    await signIn();
    const saved = { ...emptyPreferences(), experiences: ["bike", "run"], regions: ["asia"] };
    await mockAccountService.savePreferences(saved);
    expect(await mockAccountService.getPreferences()).toEqual(saved);
    await mockAccountService.savePreferences(emptyPreferences());
    expect(await mockAccountService.getPreferences()).toEqual(emptyPreferences());
  });

  it("persists newsletter and connected-account toggles", async () => {
    await signIn();
    await mockAccountService.setNewsletter(false);
    await mockAccountService.setConnectedAccount("google", true);
    const profile = await mockAccountService.getProfile();
    expect(profile.newsletter.subscribed).toBe(false);
    expect(profile.connectedAccounts.find((entry) => entry.provider === "google")?.connected).toBe(true);
  });

  it("adds and removes favorites using the home fixtures, ignoring unknown ids and duplicates", async () => {
    await signIn();
    const { homeFixture } = await import("@/mocks/fixtures/home");
    const id = homeFixture.featuredExperienceIds[0]!;
    await mockAccountService.addFavorite({ kind: "experience", id });
    await mockAccountService.addFavorite({ kind: "experience", id });
    await mockAccountService.addFavorite({ kind: "hotel", id: "does-not-exist" });
    expect((await mockAccountService.listFavorites()).map((f) => f.id)).toEqual([id]);
    expect((await mockAccountService.getSummary()).favoritesCount).toBe(1);
    await mockAccountService.removeFavorite({ kind: "experience", id });
    expect(await mockAccountService.listFavorites()).toEqual([]);
  });

  it("keeps a favorite package that only the Lifestyle pages list, linked to its page, and ignores an unknown one", async () => {
    await signIn();
    await mockAccountService.addFavorite({ kind: "package", id: "scottish-links" });
    await mockAccountService.addFavorite({ kind: "package", id: "no-such-package" });
    const favorites = await mockAccountService.listFavorites();
    expect(favorites).toHaveLength(1);
    expect(favorites[0]).toMatchObject({ id: "scottish-links", kind: "package", item: { href: "/packages/p/scottish-links", title: "The Great Scottish Links Journey" } });
  });

  it("keeps state per user", async () => {
    await signIn("a@example.com");
    await mockAccountService.setNewsletter(false);
    await signIn("b@example.com");
    expect((await mockAccountService.getProfile()).newsletter.subscribed).toBe(true);
  });

  it("checks password rules without storing anything", async () => {
    await signIn();
    expect(await mockAccountService.changePassword({ currentPassword: "a", newPassword: "short", confirmPassword: "short" })).toMatchObject({ ok: false });
    expect(await mockAccountService.changePassword({ currentPassword: "old-password", newPassword: "new-password-1", confirmPassword: "new-password-1" })).toEqual({ ok: true });
    expect([...store.values()].join()).not.toContain("new-password-1");
  });

  it("refuses to run in production", async () => {
    vi.stubEnv("SITE_ENV", "production");
    await expect(mockAccountService.getSummary()).rejects.toThrow(MockAuthInProductionError);
  });
});
