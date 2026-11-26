import { describe, expect, it } from "vitest";
import { FILTER_PARAMS, PAGINATION_PARAM } from "@/constants/seo";
import { urlPolicy } from "./url-policy";

describe("urlPolicy", () => {
  it("noindexes and nofollows everything while indexing is off", () => {
    for (const type of ["home", "static", "category", "destination", "detail", "search", "account", "checkout"] as const) {
      expect(urlPolicy({ type, path: "/x" }, false)).toEqual({ canonical: "/x", robots: { index: false, follow: false } });
    }
  });

  it("indexes clean catalog and static pages when indexing is on", () => {
    expect(urlPolicy({ type: "category", path: "/hotels/eco-lodges" }, true)).toEqual({ canonical: "/hotels/eco-lodges", robots: { index: true, follow: true } });
    expect(urlPolicy({ type: "destination", path: "/destinations/asia", query: {} }, true).robots.index).toBe(true);
    expect(urlPolicy({ type: "static", path: "/privacy", query: { a: undefined, b: "" } }, true).robots.index).toBe(true);
  });

  it("never indexes search, account or checkout", () => {
    expect(urlPolicy({ type: "search", path: "/search" }, true).robots).toEqual({ index: false, follow: true });
    expect(urlPolicy({ type: "account", path: "/account" }, true).robots).toEqual({ index: false, follow: false });
    expect(urlPolicy({ type: "checkout", path: "/checkout" }, true).robots).toEqual({ index: false, follow: false });
  });

  it("points a filtered variant at the clean path, noindex but followed", () => {
    const policy = urlPolicy({ type: "destination", path: "/destinations/bali-indonesia", query: { category: "yoga-retreats" } }, true);
    expect(policy).toEqual({ canonical: "/destinations/bali-indonesia", robots: { index: false, follow: true } });
    expect(urlPolicy({ type: "destination", path: "/destinations", query: { region: ["asia"] } }, true).robots.index).toBe(false);
  });

  it("treats every shared filter parameter as a filter, but an empty value filters nothing", () => {
    for (const name of FILTER_PARAMS) {
      expect(urlPolicy({ type: "category", path: "/hotels/eco-lodges", query: { [name]: "x" } }, true).robots, name).toEqual({ index: false, follow: true });
      expect(urlPolicy({ type: "category", path: "/hotels/eco-lodges", query: { [name]: ["x"] } }, true).robots.index, `${name}[]`).toBe(false);
      expect(urlPolicy({ type: "category", path: "/hotels/eco-lodges", query: { [name]: "" } }, true).robots.index, `${name}=`).toBe(true);
    }
  });

  it("keeps pagination and tracking parameters indexable with the page's own canonical", () => {
    expect(urlPolicy({ type: "category", path: "/hotels/eco-lodges", query: { [PAGINATION_PARAM]: "2" } }, true).robots).toEqual({ index: true, follow: true });
    expect(urlPolicy({ type: "category", path: "/hotels/eco-lodges", query: { utm_source: "news" } }, true).robots.index).toBe(true);
  });

  it("canonicalises a detail page with stay dates to the clean URL, noindex but followed", () => {
    const path = "/hotels/h/azure-spa-and-wellness-resort-krabi";
    expect(urlPolicy({ type: "detail", path }, true).robots).toEqual({ index: true, follow: true });
    for (const query of [{ checkIn: "2099-12-01", checkOut: "2099-12-04" }, { rooms: "2" }, { adults: "3" }, { children: "1" }, { childAges: "4,7" }, { flex: "2" }, { mock: "partial" }]) {
      expect(urlPolicy({ type: "detail", path, query }, true), JSON.stringify(query)).toEqual({ canonical: path, robots: { index: false, follow: true } });
    }
  });
});
