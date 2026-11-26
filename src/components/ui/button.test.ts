import { describe, expect, it } from "vitest";
import { cn } from "@/helpers/cn";
import { buttonVariants } from "./button";

describe("Button variants regression", () => {
  it("lets callers add a 44px minimum height on top of the size", () => {
    const classes = cn(buttonVariants({ size: "sm" }), "min-h-11");
    expect(classes).toContain("min-h-11");
    expect(classes).toContain("h-9");
  });

  it("keeps the outline variant's border token", () => {
    expect(buttonVariants({ variant: "outline" })).toContain("border-border");
    expect(buttonVariants({ variant: "primary" })).toContain("bg-accent");
  });
});
