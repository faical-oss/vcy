import "server-only";
import type { Metadata } from "next";
import { FILTER_PARAMS } from "@/constants/seo";
import { isIndexingEnabled } from "@/lib/env";

/** The kinds of URL the site serves. New kinds (hotel detail, search...) are added here, with their rule. */
export type UrlType =
  | "home"
  | "static" // privacy, terms, support
  | "category" // /experiences/<category>, /hotels/<category>, group listings
  | "destination" // country and region pages, the destinations index
  | "detail" // hotel, experience, package detail (not built yet)
  | "search" // result pages: dynamic, never indexed
  | "account"
  | "checkout";

export interface UrlPolicyInput {
  type: UrlType;
  /** Path from the route helpers, without a query string. */
  path: string;
  /** Query parameters of the request, if the caller has them. A filter parameter (FILTER_PARAMS) makes the URL a filtered variant. */
  query?: Readonly<Record<string, string | readonly string[] | undefined>>;
}

export interface UrlPolicy {
  /** Path of the page every variant of this URL points to. */
  canonical: string;
  robots: { index: boolean; follow: boolean };
}

const NEVER_INDEXED: ReadonlySet<UrlType> = new Set(["search", "account", "checkout"]);

/**
 * True when the request carries a filter parameter with a value. An empty value (`?category=`) filters nothing: the page
 * is the clean page, and the header rule in next.config.ts (which Next does not match on an empty value) agrees.
 * `page` and tracking parameters are not filters.
 */
function isFilteredVariant(query: UrlPolicyInput["query"]): boolean {
  return FILTER_PARAMS.some((name) => {
    const value = query?.[name];
    return Array.isArray(value) ? value.some((entry) => entry !== "") : value !== undefined && value !== "";
  });
}

/**
 * The one place that maps a URL type to its canonical and robots rule.
 * - Indexing off (`INDEXING_ENABLED` not true): everything is noindex, nofollow, whatever the type.
 * - Search results, account and checkout: noindex (account and checkout also nofollow).
 * - A filtered variant (a FILTER_PARAMS parameter in the query) of an indexable page: canonical is the clean path, noindex
 *   but followed, so filters never compete with the page they filter. The page cannot read the query in its static
 *   metadata, so the same rule is applied as an X-Robots-Tag response header by next.config.ts, always. A filter worth
 *   ranking gets its own clean, indexable URL instead. `?page=` and tracking parameters are not filters.
 */
export function urlPolicy(input: UrlPolicyInput, indexingEnabled: boolean): UrlPolicy {
  const canonical = input.path;
  if (!indexingEnabled) return { canonical, robots: { index: false, follow: false } };
  if (NEVER_INDEXED.has(input.type)) return { canonical, robots: { index: false, follow: input.type === "search" } };
  if (isFilteredVariant(input.query)) return { canonical, robots: { index: false, follow: true } };
  return { canonical, robots: { index: true, follow: true } };
}

/** `alternates` + `robots` for `generateMetadata`, from the policy and the current indexing flag. */
export function pageSeo(input: UrlPolicyInput): Pick<Metadata, "alternates" | "robots"> {
  const { canonical, robots } = urlPolicy(input, isIndexingEnabled());
  return { alternates: { canonical }, robots };
}
