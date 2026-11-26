import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("uses the first letters of the first and last name", () => {
    expect(initialsOf("Sarah M.")).toBe("SM");
    expect(initialsOf("Marcus L.")).toBe("ML");
    expect(initialsOf("Ana Maria de Souza")).toBe("AS");
  });
  it("uses the first two letters of a one-word name", () => {
    expect(initialsOf("Priya")).toBe("PR");
    expect(initialsOf("x")).toBe("X");
  });
  it("handles accents, extra spaces and empty names", () => {
    expect(initialsOf("  élodie   dupont ")).toBe("ÉD");
    expect(initialsOf("")).toBe("");
  });
});
