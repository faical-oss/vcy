// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BarSummary } from "@/helpers/booking-bar-summary";
import { BookingBarSummary } from "./booking-bar-summary";

const summary = (items: string[], note = ""): BarSummary => ({
  dates: "26–28 Nov",
  guests: "4 travellers",
  rooms: { summary: `${items.length} of 4 rooms selected`, items, note, short: `${items.length} of 4 rooms selected` },
  price: null,
});

describe("BookingBarSummary rooms", () => {
  it("lists the rooms one per line, two at most, then +N more", () => {
    const { container } = render(<BookingBarSummary summary={summary(["1 × Deluxe", "1 × Suite", "1 × Pool", "1 × Garden"])} />);
    const list = container.querySelector("[data-booking-rooms]")!;
    expect(list.className).toContain("flex-col");
    expect([...list.children].map((child) => child.textContent)).toEqual(["1 × Deluxe,", "1 × Suite,", "+2 more"]);
  });

  it("shows every room when there are two or fewer, and what is still to do on its own line", () => {
    const { container, getByText } = render(<BookingBarSummary summary={summary(["1 × Deluxe", "1 × Suite"], "Choose 2 more rooms to reserve.")} />);
    expect(container.querySelector("[data-booking-rooms]")!.children).toHaveLength(2);
    expect(getByText("Choose 2 more rooms to reserve.")).toBeTruthy();
  });

  it("has no list when nothing is chosen", () => {
    const { container } = render(<BookingBarSummary summary={{ ...summary([]), rooms: { summary: "Choose 4 rooms to reserve.", items: [], note: "", short: "Choose 4 rooms to reserve." } }} />);
    expect(container.querySelector("[data-booking-rooms]")).toBeNull();
  });
});
