import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "./password-schema";

const valid = { currentPassword: "old-password-1", newPassword: "new-password-2", confirmPassword: "new-password-2" };

describe("password change rules", () => {
  it("accepts a valid change", () => {
    expect(validatePasswordChange(valid)).toEqual({ ok: true });
  });

  it("requires the current password", () => {
    const result = validatePasswordChange({ ...valid, currentPassword: "" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.currentPassword).toMatch(/current password/i);
  });

  it("requires at least 8 characters", () => {
    const result = validatePasswordChange({ ...valid, newPassword: "short", confirmPassword: "short" });
    expect(!result.ok && result.errors.newPassword).toMatch(/at least 8 characters/);
  });

  it("requires the confirmation to match", () => {
    const result = validatePasswordChange({ ...valid, confirmPassword: "different-1" });
    expect(!result.ok && result.errors.confirmPassword).toMatch(/don't match/);
  });

  it("requires the new password to differ from the current one", () => {
    const result = validatePasswordChange({ currentPassword: "same-password", newPassword: "same-password", confirmPassword: "same-password" });
    expect(!result.ok && result.errors.newPassword).toMatch(/different/);
  });

  it("never echoes passwords in error messages", () => {
    const result = validatePasswordChange({ currentPassword: "hunter2hunter2", newPassword: "hunter2hunter2", confirmPassword: "x" });
    expect(JSON.stringify(result)).not.toContain("hunter2");
  });
});
