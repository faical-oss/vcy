// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewFormState } from "@/interfaces";
import { ReviewForm } from "./review-form";

// No AuthProvider here on purpose: the review form is open to everyone and must not need a login.

type Action = (previous: ReviewFormState, data: FormData) => Promise<ReviewFormState>;

const text = "A calm, well run place with excellent food.";
const submit = () => screen.getByRole("button", { name: /Submit review|Sending/ });

async function fill(user: ReturnType<typeof userEvent.setup>, { rating = 5, review = text } = {}) {
  await user.click(screen.getByRole("radio", { name: new RegExp(`^${rating} out of 5`) }));
  await user.click(screen.getByLabelText("Your review"));
  await user.paste(review);
}

beforeEach(() => window.history.replaceState(null, "", "/"));
afterEach(cleanup);

describe("ReviewForm", () => {
  it("posts the rating and text, then thanks the visitor and shows nothing in the list", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>().mockResolvedValue({ status: "success" });
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await fill(user, { rating: 4 });
    await user.click(submit());
    await waitFor(() => expect(screen.getAllByText("Thanks, your review will appear after moderation.").length).toBeGreaterThan(0));
    const data = action.mock.calls[0][1];
    expect(data.get("hotelSlug")).toBe("hotel-a");
    expect(data.get("rating")).toBe("4");
    expect(data.get("title")).toBeNull();
    expect(data.get("text")).toBe(text);
    expect(screen.queryByRole("button", { name: "Submit review" })).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Thanks, your review will appear after moderation.");
    const box = screen.getAllByText("Thanks, your review will appear after moderation.").find((node) => node.tagName === "P")!;
    expect(box.className).toContain("bg-success");
    expect(box.className).toContain("rounded");
  });

  it("works signed out: it never asks for a login", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>().mockResolvedValue({ status: "success" });
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await fill(user);
    await user.click(submit());
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });

  it("shows the live counter and the minimum while typing", async () => {
    const user = userEvent.setup();
    render(<ReviewForm hotelSlug="hotel-a" action={vi.fn<Action>()} />);
    expect(screen.getByText(/0 \/ 2000 · at least 20/)).toBeTruthy();
    await user.type(screen.getByLabelText("Your review"), "Great");
    expect(screen.getByText(/5 \/ 2000 · at least 20/)).toBeTruthy();
    await user.paste(" and a very quiet place to rest");
    expect(screen.getByText(/36 \/ 2000$/)).toBeTruthy();
  });

  it("validates the text on blur and the rating on leaving the stars", async () => {
    const user = userEvent.setup();
    render(<ReviewForm hotelSlug="hotel-a" action={vi.fn<Action>()} />);
    expect(screen.queryByRole("alert")).toBeNull();
    await user.type(screen.getByLabelText("Your review"), "Too short");
    await user.tab();
    expect(screen.getByText("Write at least 20 characters (9 so far).")).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: /^3 out of 5/ }));
    await user.tab();
    expect(screen.queryByText("Choose a rating from 1 to 5.")).toBeNull();
  });

  it("on submit shows every error and moves focus to the first invalid field, without calling the action", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>();
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await user.click(submit());
    expect(screen.getByText("Choose a rating from 1 to 5.")).toBeTruthy();
    expect(screen.getByText("Tell us about your experience.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: /^1 out of 5/ }));
    await user.click(screen.getByRole("radio", { name: /^5 out of 5/ }));
    await user.click(submit());
    expect(document.activeElement).toBe(screen.getByLabelText("Your review"));
    expect(screen.getByLabelText("Your review").getAttribute("aria-invalid")).toBe("true");
    expect(action).not.toHaveBeenCalled();
  });

  it("disables the form while sending, blocks a double submit, and announces it", async () => {
    const user = userEvent.setup();
    let finish: (state: ReviewFormState) => void = () => {};
    const action = vi.fn<Action>(() => new Promise((resolve) => (finish = resolve)));
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await fill(user);
    await user.click(submit());
    await waitFor(() => expect(screen.getByRole("button", { name: /Sending/ })).toBeTruthy());
    expect(screen.getByLabelText("Your review").matches(":disabled")).toBe(true);
    expect(screen.getByRole("radio", { name: /^2 out of 5/ }).matches(":disabled")).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Sending your review…");
    await user.click(screen.getByRole("button", { name: /Sending/ }));
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => finish({ status: "success" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Sending/ })).toBeNull());
  });

  it("keeps the input on error, announces it and resends with Try again", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>().mockResolvedValueOnce({ status: "error", code: "unavailable" }).mockResolvedValueOnce({ status: "success" });
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await fill(user, { rating: 3 });
    await user.click(submit());
    await waitFor(() => expect(screen.getAllByText(/could not send your review/).length).toBeGreaterThan(0));
    expect(screen.getByRole("status").textContent).toMatch(/could not send your review/);
    expect((screen.getByLabelText("Your review") as HTMLTextAreaElement).value).toBe(text);
    expect((screen.getByRole("radio", { name: /^3 out of 5/ }) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getAllByText("Thanks, your review will appear after moderation.").length).toBeGreaterThan(0));
    expect(action).toHaveBeenCalledTimes(2);
    expect(action.mock.calls[1][1].get("text")).toBe(text);
  });

  it("shows the rate limit message and field errors from the server", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>().mockResolvedValue({ status: "error", code: "rate_limited" });
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await fill(user);
    await user.click(submit());
    await waitFor(() => expect(screen.getAllByText(/sent several reviews/).length).toBeGreaterThan(0));
  });

  it("passes the dev ?mock= value to the action", async () => {
    window.history.replaceState(null, "", "/?mock=error");
    const user = userEvent.setup();
    const action = vi.fn<Action>().mockResolvedValue({ status: "success" });
    render(<ReviewForm hotelSlug="hotel-a" action={action} />);
    await fill(user);
    await user.click(submit());
    await waitFor(() => expect(action).toHaveBeenCalled());
    expect(action.mock.calls[0][1].get("mock")).toBe("error");
  });
});
