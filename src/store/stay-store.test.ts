// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { stayStore } from "./stay-store";

beforeEach(() => stayStore.hydrate(`page-${Math.random()}`, { rooms: 1, adults: 2, children: 0, childAges: [] }));
const state = () => stayStore.getSnapshot();

describe("stay store", () => {
  it("applies the rooms and adults rules", () => {
    stayStore.setRooms(3);
    expect(state()).toMatchObject({ rooms: 3, adults: 3 });
    stayStore.setAdults(2);
    expect(state()).toMatchObject({ rooms: 2, adults: 2 });
    stayStore.setRooms(1);
    expect(state()).toMatchObject({ rooms: 1, adults: 2 });
  });

  it("keeps one age per child, with no default age, and keeps chosen ages", () => {
    stayStore.setChildren(2);
    expect(state().childAges).toEqual([null, null]);
    stayStore.setChildAge(0, 9);
    stayStore.setChildren(3);
    expect(state().childAges).toEqual([9, null, null]);
    stayStore.setChildAge(0, null);
    expect(state().childAges).toEqual([null, null, null]);
    stayStore.setChildAge(1, 4);
    stayStore.setChildren(2);
    expect(state().childAges).toEqual([null, 4]);
  });

  it("takes the guest limits of the page: an experience allows more adults than the shared limit", () => {
    stayStore.hydrate("/experiences/e/yoga", { rooms: 1, adults: 2, children: 0, childAges: [] }, { maxRooms: 8, maxAdults: 12, maxChildren: 6 });
    stayStore.setAdults(12);
    expect(state().adults).toBe(12);
    stayStore.hydrate("/hotels/h/azure", { rooms: 1, adults: 2, children: 0, childAges: [] });
    stayStore.setAdults(12);
    expect(state().adults).toBe(9);
  });

  it("limits the room selection to the rooms searched", () => {
    stayStore.setRooms(2);
    stayStore.adjustRoom("a", 1);
    stayStore.adjustRoom("b", 1);
    stayStore.adjustRoom("a", 1); // sum reached
    expect(state().selection).toEqual({ a: 1, b: 1 });
  });

  it("starts the room choice again when the dates or the travellers change, and not for other edits", () => {
    stayStore.setRooms(2);
    stayStore.setDates("2099-12-01", "2099-12-04");
    stayStore.adjustRoom("a", 1);
    expect(state().selection).toEqual({ a: 1 });
    stayStore.setDates("2099-12-02", "2099-12-05");
    expect(state().selection).toEqual({});
    for (const change of [() => stayStore.setAdults(5), () => stayStore.setRooms(3), () => stayStore.setChildren(2), () => stayStore.setChildAge(0, 9)]) {
      stayStore.adjustRoom("a", 1);
      expect(state().selection).toEqual({ a: 1 });
      change();
      expect(state().selection).toEqual({});
    }
    stayStore.adjustRoom("a", 1);
    stayStore.setFlexDays(2); // flexibility is not part of the search
    stayStore.setDates("2099-12-02", "2099-12-05"); // same dates: no change
    stayStore.setAdults(5); // same value: no change
    expect(state().selection).toEqual({ a: 1 });
  });

  it("starts over for another page and keeps its state for the same page", () => {
    stayStore.setRooms(2);
    stayStore.adjustRoom("a", 1);
    const key = state().key as string;
    stayStore.hydrate(key, { rooms: 5, adults: 5, children: 0, childAges: [] });
    expect(state()).toMatchObject({ rooms: 2, selection: { a: 1 } });
    stayStore.hydrate("other", { rooms: 5, adults: 1, children: 0, childAges: [] });
    expect(state()).toMatchObject({ rooms: 1, adults: 1, selection: {} }); // normalized: rooms <= adults
  });
});

describe("room selection is never restored", () => {
  it("starts empty on every visit, even when an earlier visit saved a choice", () => {
    window.localStorage.setItem("vku:rooms:/hotels/h/a|2099-12-01|2099-12-03", JSON.stringify({ t: Date.now(), selection: { a: 1 } }));
    stayStore.hydrate("reset", { rooms: 1, adults: 2, children: 0, childAges: [] });
    stayStore.hydrateFromBrowser("/hotels/h/a", "checkIn=2099-12-01&checkOut=2099-12-03");
    expect(stayStore.getSnapshot().selection).toEqual({});
    stayStore.adjustRoom("a", 1);
    expect(window.localStorage.getItem("vku:rooms:/hotels/h/a|2099-12-01|2099-12-03")).toContain('"a":1'); // untouched legacy entry, never read or written
    stayStore.hydrate("reset2", { rooms: 1, adults: 2, children: 0, childAges: [] });
    stayStore.hydrateFromBrowser("/hotels/h/a", "checkIn=2099-12-01&checkOut=2099-12-03");
    expect(stayStore.getSnapshot().selection).toEqual({});
  });
});
