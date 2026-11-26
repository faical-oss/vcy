// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HotelReview, ReviewListResult } from "@/interfaces";
import { ReviewsList, type LoadMoreReviews } from "./reviews-list";

afterEach(cleanup);

const review = (n: number): HotelReview => ({ id: `r${n}`, author: `Guest ${n}`, location: "London, UK", title: `Title ${n}`, date: "2026-09-01", rating: 4, text: `Text ${n}` });
const batch = (from: number, count: number) => Array.from({ length: count }, (_, i) => review(from + i));

describe("ReviewsList", () => {
  it("never traps the scroll: no inner box below md, and from md a box that chains to the page (overscroll auto)", () => {
    render(<ReviewsList initial={batch(1, 3)} total={3} slug="hotel-a" />);
    const region = screen.getByRole("region", { name: "Guest reviews" });
    expect(region.className).toContain("md:overflow-y-auto");
    expect(region.className).toContain("md:overscroll-auto");
    expect(region.className).not.toContain("overscroll-contain");
    expect(region.className).not.toMatch(/(^|\s)overflow-y-auto/);
  });

  it("shows the server's reviews and 'Showing 3 of 25 reviews' with a load button", () => {
    render(<ReviewsList initial={batch(1, 3)} total={25} slug="hotel-a" loadMore={vi.fn()} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Showing 3 of 25 reviews")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Load more reviews" })).toBeTruthy();
  });

  it("adds the next page, keeps the old reviews, updates the count, announces it and focuses the first new review", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn<LoadMoreReviews>().mockResolvedValue({ ok: true, items: batch(4, 10) });
    render(<ReviewsList initial={batch(1, 3)} total={25} slug="hotel-a" loadMore={loadMore} />);
    await user.click(screen.getByRole("button", { name: "Load more reviews" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(13));
    expect(loadMore).toHaveBeenCalledWith("hotel-a", 3);
    expect(screen.getByText("Showing 13 of 25 reviews")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("10 more reviews loaded. Showing 13 of 25 reviews.");
    expect(screen.getByText("Title 1")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Title 4").closest("li")));
  });

  it("never shows more than the total and hides the button when all are shown", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn<LoadMoreReviews>().mockResolvedValue({ ok: true, items: batch(4, 10) });
    render(<ReviewsList initial={batch(1, 3)} total={6} slug="hotel-a" loadMore={loadMore} />);
    await user.click(screen.getByRole("button", { name: "Load more reviews" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(6));
    expect(screen.getByText("Showing all 6 reviews")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Load more|Try again/ })).toBeNull();
  });

  it("shows a loading state, ignores a second click while loading", async () => {
    const user = userEvent.setup();
    let finish: (result: ReviewListResult) => void = () => {};
    const loadMore = vi.fn<LoadMoreReviews>(() => new Promise((resolve) => (finish = resolve)));
    render(<ReviewsList initial={batch(1, 3)} total={25} slug="hotel-a" loadMore={loadMore} />);
    await user.click(screen.getByRole("button", { name: "Load more reviews" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Loading/ })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Loading/ }));
    expect(loadMore).toHaveBeenCalledTimes(1);
    await act(async () => finish({ ok: true, items: batch(4, 10) }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(13));
  });

  it("keeps the list on error, says so, and retries", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn<LoadMoreReviews>().mockResolvedValueOnce({ ok: false, code: "unavailable" }).mockResolvedValueOnce({ ok: true, items: batch(4, 10) });
    render(<ReviewsList initial={batch(1, 3)} total={25} slug="hotel-a" loadMore={loadMore} />);
    await user.click(screen.getByRole("button", { name: "Load more reviews" }));
    await waitFor(() => expect(screen.getAllByText("We could not load more reviews.").length).toBeGreaterThan(0));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(13));
  });

  it("has no button without a loader, and says nothing extra when the server sent everything", () => {
    const { rerender } = render(<ReviewsList initial={batch(1, 3)} total={25} slug="hotel-a" />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<ReviewsList initial={batch(1, 3)} total={3} slug="hotel-a" loadMore={vi.fn()} />);
    expect(screen.queryByText(/Showing/)).toBeNull();
  });
});
