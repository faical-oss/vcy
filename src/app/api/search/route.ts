import { queryToSearchParams } from "@/helpers/search-results";
import { todayIso } from "@/helpers/stay-params";
import type { MockScenario } from "@/interfaces";
import { isMockScenarioEnabled } from "@/lib/flags";
import { getSearchService } from "@/services";

const SCENARIOS: readonly MockScenario[] = ["available", "partial", "none", "error"];
const noStore = { "cache-control": "no-store" };

/**
 * Search results: `GET /api/search?type=&category=&destination=&q=&checkIn=&checkOut=&rooms=&adults=&children=&childAges=&sort=&page=
 * &minPrice=&maxPrice=&types=&stars=&places=&amenities=&board=&rating=`. Without valid dates the results come back without prices
 * and availability. Never cached, never called while rendering a page (the browser calls it). `mock` (available, partial, none,
 * error) picks a scenario of the mock service, only in a mock, non-production build.
 * TODO(api): backed by the mock service until the real search contract is known.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const params = queryToSearchParams(searchParams.toString(), todayIso());
  if (!params) return Response.json({ error: "invalid_search" }, { status: 400, headers: noStore });
  const requested = searchParams.get("mock") as MockScenario | null;
  const scenario = isMockScenarioEnabled() && requested && SCENARIOS.includes(requested) ? requested : undefined;
  try {
    return Response.json(await getSearchService().search(params, { scenario }), { headers: noStore });
  } catch {
    return Response.json({ error: "search_failed" }, { status: 502, headers: noStore });
  }
}
