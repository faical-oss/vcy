import { describe, expect, it } from "vitest";
import { checkoutQuery, checkoutQueryFromUrl, readCheckoutTarget } from "./checkout-params";

describe("checkout parameters", () => {
  it("builds the full query for a valid stay, with child ages and the optional room", () => {
    const query = checkoutQuery({ kind: "experience", id: "ubud-retreat", checkIn: "2099-12-01", checkOut: "2099-12-07", rooms: 2, adults: 3, children: 2, childAges: [2, 9], flexDays: 3, roomId: "room-1" });
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({ type: "experience", id: "ubud-retreat", checkIn: "2099-12-01", checkOut: "2099-12-07", rooms: "2", adults: "3", children: "2", childAges: "2,9", flex: "3", roomId: "room-1" });
  });

  it("leaves out what is empty: no child ages without children, no flex for exact dates, no room unless given", () => {
    const query = checkoutQuery({ kind: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-03", rooms: 1, adults: 2, children: 0, childAges: [], flexDays: 0 });
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({ type: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-03", rooms: "1", adults: "2", children: "0" });
  });

  it("carries the stay of the page URL to checkout for a room shortcut, and works without any stay", () => {
    const current = new URLSearchParams("checkIn=2099-12-01&checkOut=2099-12-03&rooms=1&adults=2&children=1&childAges=4&other=x");
    expect(Object.fromEntries(new URLSearchParams(checkoutQueryFromUrl(current, { kind: "hotel", id: "azure", roomId: "r1" })))).toEqual({ type: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-03", rooms: "1", adults: "2", children: "1", childAges: "4", roomId: "r1" });
    expect(checkoutQueryFromUrl(new URLSearchParams(), { kind: "experience", id: "x" })).toBe("type=experience&id=x");
  });

  it("sends the rooms chosen on a hotel page as room id and quantity pairs", () => {
    const query = checkoutQuery({ kind: "hotel", id: "azure", checkIn: "2099-12-01", checkOut: "2099-12-03", rooms: 3, adults: 3, selection: { r1: 2, r2: 1 } });
    expect(new URLSearchParams(query).get("selection")).toBe("r1:2,r2:1");
    expect(new URLSearchParams(checkoutQuery({ kind: "hotel", id: "azure", selection: {} })).has("selection")).toBe(false);
  });

  it("reads the target (hotel, experience or package) and ignores an unknown type", () => {
    expect(readCheckoutTarget({ type: "hotel", id: "azure", roomId: "r1" })).toEqual({ kind: "hotel", id: "azure", roomId: "r1", selection: {} });
    expect(readCheckoutTarget({ type: "package", id: "x" }).kind).toBe("package");
    expect(readCheckoutTarget({ type: "spaceship", id: "x" }).kind).toBeNull();
    expect(readCheckoutTarget({})).toEqual({ kind: null, id: "", roomId: "", selection: {} });
    expect(readCheckoutTarget({ type: "hotel", id: "a", selection: "r1:2,r2:1,bad,r3:0,r4:x" }).selection).toEqual({ r1: 2, r2: 1 });
  });
});
