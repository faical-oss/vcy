import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect, getCurrentSession, headerValue } = vi.hoisted(() => ({
  headerValue: { current: null as string | null },
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  getCurrentSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({ headers: async () => ({ get: () => headerValue.current }) }));
vi.mock("@/features/auth/session", () => ({ getCurrentSession }));

import { requireSession } from "./require-session";

describe("requireSession (server-side guard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headerValue.current = null;
  });

  it("redirects to Home with the login dialog trigger when there is no session", async () => {
    getCurrentSession.mockResolvedValue(null);
    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT:/?auth=login");
    expect(redirect).toHaveBeenCalledWith("/?auth=login");
  });

  it("remembers the requested account page so sign-in can return to it", async () => {
    getCurrentSession.mockResolvedValue(null);
    headerValue.current = "/account/trips";
    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT:/?auth=login&next=%2Faccount%2Ftrips");
  });

  it("ignores a path outside the account area", async () => {
    getCurrentSession.mockResolvedValue(null);
    headerValue.current = "//evil.example";
    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT:/?auth=login");
  });

  it("returns the session when signed in, without redirecting", async () => {
    const session = { userId: "u1", displayName: "Jane", email: "jane@example.com" };
    getCurrentSession.mockResolvedValue(session);
    await expect(requireSession()).resolves.toEqual(session);
    expect(redirect).not.toHaveBeenCalled();
  });
});
