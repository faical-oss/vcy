// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PREFERENCE_CATEGORIES } from "@/constants/preferences";
import type { AccountActionResult, TravelPreferences } from "@/interfaces";
import { PreferencesView } from "./preferences-view";

afterEach(cleanup);

const ok = async (): Promise<AccountActionResult> => ({ ok: true });

describe("preference wizard", () => {
  it("opens the wizard on first visit and lets Continue work with nothing selected", async () => {
    const user = userEvent.setup();
    render(<PreferencesView initial={null} onSave={ok} />);
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    expect(screen.getByText("0 selected")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Step 2 of 5")).toBeTruthy();
    expect(screen.getByRole("heading", { name: PREFERENCE_CATEGORIES[1]!.question })).toBeTruthy();
  });

  it("announces a live count and exposes the activity tiles as checkboxes in a group named by its prompt", async () => {
    const user = userEvent.setup();
    render(<PreferencesView initial={null} onSave={ok} />);
    expect(screen.getByRole("group", { name: "Select all that apply" })).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(PREFERENCE_CATEGORIES[0]!.options.length);
    const bike = screen.getByRole("checkbox", { name: "Bike" }) as HTMLInputElement;
    expect(bike.checked).toBe(false);
    await user.click(bike);
    expect(bike.checked).toBe(true);
    await user.keyboard(" ");
    expect(bike.checked).toBe(false);
    await user.keyboard(" ");
    expect(screen.getByText("1 selected").getAttribute("aria-live")).toBe("polite");
  });

  it("keeps the chips for the other steps", async () => {
    const user = userEvent.setup();
    render(<PreferencesView initial={null} onSave={ok} />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Europe" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps selections when going Back", async () => {
    const user = userEvent.setup();
    render(<PreferencesView initial={null} onSave={ok} />);
    await user.click(screen.getByRole("checkbox", { name: "Bike" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("button", { name: "Back" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect((screen.getByRole("checkbox", { name: "Bike" }) as HTMLInputElement).checked).toBe(true);
  });

  it("saves on step 5 and shows the summary with the success banner and pluralised count", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(ok);
    render(<PreferencesView initial={null} onSave={onSave} />);
    await user.click(screen.getByRole("checkbox", { name: "Bike" }));
    for (let step = 0; step < 4; step += 1) await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Step 5 of 5")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "By myself" }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ experiences: ["bike"], style: ["by-myself"] }));
    expect(await screen.findByRole("heading", { name: "Your travel preferences" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Preferences saved.");
    expect(screen.getByText("2 preferences selected")).toBeTruthy();
    expect(screen.getAllByText("No preferences selected")).toHaveLength(3);
  });

  it("keeps the wizard and shows an error when saving fails", async () => {
    const user = userEvent.setup();
    render(<PreferencesView initial={null} onSave={async () => ({ ok: false, code: "unavailable" })} />);
    for (let step = 0; step < 4; step += 1) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/isn't available right now/);
    expect(screen.getByText("Step 5 of 5")).toBeTruthy();
  });

  it("shows the summary first when preferences exist, and Edit reopens the wizard pre-filled at step 1", async () => {
    const user = userEvent.setup();
    const saved: TravelPreferences = { experiences: ["bike"], regions: [], places: [], purpose: [], style: [] };
    render(<PreferencesView initial={saved} onSave={ok} />);
    expect(screen.getByRole("heading", { name: "Your travel preferences" })).toBeTruthy();
    expect(screen.getByText("1 preference selected")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Edit preferences" }));
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    const tiles = within(screen.getByRole("group"));
    expect((tiles.getByRole("checkbox", { name: "Bike" }) as HTMLInputElement).checked).toBe(true);
  });
});
