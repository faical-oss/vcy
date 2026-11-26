// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StarRatingInput } from "./star-rating-input";

afterEach(cleanup);

function Harness({ onSubmit = vi.fn(), error, disabled }: { onSubmit?: () => void; error?: string; disabled?: boolean }) {
  const [value, setValue] = useState(0);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <StarRatingInput name="rating" label="Your rating" value={value} onChange={setValue} required error={error} disabled={disabled} />
    </form>
  );
}

const star = (value: number) => screen.getByRole("radio", { name: new RegExp(`^${value} out of 5`) });

describe("StarRatingInput", () => {
  it("is a labelled, required radio group with five stars and a prompt before any choice", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: /Your rating/ });
    expect(group.getAttribute("aria-required")).toBe("true");
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.queryByText("Poor")).toBeNull();
  });

  it("selects on click or tap and names the value from Poor to Excellent", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(star(1));
    expect((star(1) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("Poor")).toBeTruthy();
    await user.click(star(5));
    expect((star(5) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("Excellent")).toBeTruthy();
  });

  it("previews on hover and returns to the chosen value on leave", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const filled = () => container.querySelectorAll("svg.fill-star").length;
    await user.click(star(2));
    expect(filled()).toBe(2);
    await user.hover(star(4).closest("label")!);
    expect(filled()).toBe(4);
    expect(screen.getByText("Very good")).toBeTruthy();
    await user.unhover(star(4).closest("label")!);
    expect(filled()).toBe(2);
    expect(screen.getByText("Fair")).toBeTruthy();
  });

  it("changes with the arrow keys and chooses with Space", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard(" ");
    expect((star(1) as HTMLInputElement).checked).toBe(true);
    await user.keyboard("{ArrowRight}");
    expect((star(2) as HTMLInputElement).checked).toBe(true);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect((star(4) as HTMLInputElement).checked).toBe(true);
    await user.keyboard("{ArrowLeft}");
    expect((star(3) as HTMLInputElement).checked).toBe(true);
  });

  it("chooses with Enter and does not submit the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect((star(1) as HTMLInputElement).checked).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("marks the group invalid and shows the error message", () => {
    render(<Harness error="Choose a rating from 1 to 5." />);
    const group = screen.getByRole("radiogroup", { name: /Your rating/ });
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe(screen.getByText("Choose a rating from 1 to 5.").id);
  });

  it("cannot be changed while disabled", () => {
    render(<Harness disabled />);
    for (const value of [1, 2, 3, 4, 5]) expect((star(value) as HTMLInputElement).disabled).toBe(true);
  });
});
