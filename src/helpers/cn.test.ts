import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn regressions", () => {
  it("keeps a text color next to a custom text-size token", () => {
    expect(cn("text-eyebrow", "text-white")).toBe("text-eyebrow text-white");
    expect(cn("text-white", "text-chip")).toBe("text-white text-chip");
    expect(cn("text-heading-sm", "text-primary")).toBe("text-heading-sm text-primary");
  });

  it("lets a later size token replace an earlier one", () => {
    expect(cn("text-title-sm", "text-title-md")).toBe("text-title-md");
  });
});
