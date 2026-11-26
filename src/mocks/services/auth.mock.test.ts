import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const cookieStore = {
  get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
  set: vi.fn((name: string, value: string) => void store.set(name, value)),
  delete: vi.fn((name: string) => void store.delete(name)),
};
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

import { DEV_SESSION_COOKIE, MockAuthInProductionError, mockAuthService } from "./auth.mock";

describe("mockAuthService production guard", () => {
  beforeEach(() => {
    vi.stubEnv("SITE_ENV", "production");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    store.clear();
    vi.clearAllMocks();
  });

  it("refuses every operation when SITE_ENV is production, before touching cookies", async () => {
    await expect(mockAuthService.getSession()).rejects.toThrow(MockAuthInProductionError);
    await expect(mockAuthService.continueWithEmail({ email: "a@b.co", mode: "login", password: "password1" })).rejects.toThrow(/production/);
    await expect(mockAuthService.continueWithProvider({ provider: "google", mode: "login" })).rejects.toThrow(/production/);
    await expect(mockAuthService.signOut()).rejects.toThrow(/production/);
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});

describe("mockAuthService in development", () => {
  beforeEach(() => {
    vi.stubEnv("SITE_ENV", "development");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    store.clear();
    vi.clearAllMocks();
  });

  it("starts a session for any valid email, with an httpOnly lax cookie", async () => {
    const result = await mockAuthService.continueWithEmail({ email: "Jane.Doe@Example.com", mode: "login", password: "password1" });
    expect(result).toEqual({
      ok: true,
      session: { userId: "dev-jane.doe@example.com", displayName: "Jane Doe", email: "jane.doe@example.com" },
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      DEV_SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(await mockAuthService.getSession()).toEqual(result.ok ? result.session : null);
  });

  it("rejects an invalid email, a short password or a missing sign-up name without creating a session", async () => {
    expect(await mockAuthService.continueWithEmail({ email: "not-an-email", mode: "signup", password: "password1" })).toEqual({
      ok: false,
      code: "invalid_email",
    });
    expect(await mockAuthService.continueWithEmail({ email: "a@b.co", mode: "login", password: "short" })).toEqual({
      ok: false,
      code: "invalid_password",
    });
    expect(
      await mockAuthService.continueWithEmail({ email: "a@b.co", mode: "signup", password: "password1", firstName: " " }),
    ).toEqual({ ok: false, code: "invalid_name" });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("uses the first name as the display name on sign-up and never puts the password in the cookie", async () => {
    const result = await mockAuthService.continueWithEmail({
      email: "a@b.co",
      mode: "signup",
      firstName: "Faical",
      password: "a-secret-password",
    });
    expect(result.ok && result.session.displayName).toBe("Faical");
    expect(JSON.stringify([...store.values()])).not.toContain("a-secret-password");
  });

  it("labels social sessions as dev logins and signs out", async () => {
    const result = await mockAuthService.continueWithProvider({ provider: "apple", mode: "signup" });
    expect(result.ok && result.session.displayName).toBe("Dev login (Apple)");
    await mockAuthService.signOut();
    expect(await mockAuthService.getSession()).toBeNull();
  });
});
