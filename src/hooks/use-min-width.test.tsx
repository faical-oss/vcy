// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMinWidth } from "./use-min-width";

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  let current = matches;
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return current;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  return (next: boolean) => {
    current = next;
    listeners.forEach((listener) => listener());
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("useMinWidth", () => {
  it("follows the media query", () => {
    const set = stubMatchMedia(true);
    const { result } = renderHook(() => useMinWidth(768));
    expect(result.current).toBe(true);
    act(() => set(false));
    expect(result.current).toBe(false);
  });

  it("counts the viewport as wide when matchMedia is missing", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(renderHook(() => useMinWidth(768)).result.current).toBe(true);
  });
});
