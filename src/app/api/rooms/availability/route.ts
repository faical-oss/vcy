import { getExperience, getHotel } from "@/features/catalog/get-catalog";
import { getPackage } from "@/features/packages/get-package";
import { parseStayForDuration } from "@/helpers/stay-duration";
import { todayIso } from "@/helpers/stay-params";
import type { MockScenario } from "@/interfaces";
import { isMockScenarioEnabled } from "@/lib/flags";
import { getAvailabilityService } from "@/services";

const SCENARIOS: readonly MockScenario[] = ["available", "partial", "none", "error"];
const noStore = { "cache-control": "no-store" };

/**
 * Room availability for a complete search: `GET /api/rooms/availability?type=hotel|experience|package&id=<slug>&checkIn=&checkOut=
 * &adults=&children=&childAges=2,5&rooms=`. Returns `{ rooms: [{ roomId, available, price, unit }] }`. Never cached, never called
 * while rendering a page (the browser calls it, after the visitor has a complete search). `mock` (available, partial, none, error)
 * picks a scenario of the mock service, only in a mock, non-production build.
 * TODO(api): backed by the mock service until the real availability contract is known.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams);
  const type = searchParams.get("type");
  const id = searchParams.get("id") ?? "";
  if ((type !== "hotel" && type !== "experience" && type !== "package") || !id) return Response.json({ error: "invalid_target" }, { status: 400, headers: noStore });

  // The same rules as the booking form: a real stay, and for an experience its duration rule (fixed or flexible) and group size.
  const product = type === "experience" ? await getExperience(id) : type === "package" ? await getPackage(id) : null;
  const hotel = type === "hotel" ? await getHotel(id) : null;
  if (!product && !hotel) return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  const stay = product ? parseStayForDuration(raw, todayIso(), product.duration, product.groupSize) : parseStayForDuration(raw, todayIso());
  if (!stay.ok) return Response.json({ error: "invalid_stay" }, { status: 400, headers: noStore });

  const requested = searchParams.get("mock") as MockScenario | null;
  const scenario = isMockScenarioEnabled() && requested && SCENARIOS.includes(requested) ? requested : undefined;
  try {
    const service = await getAvailabilityService();
    const { checkIn, checkOut, adults, children, childAges, rooms } = stay.stay;
    const response = await service.getRoomAvailability({ kind: type, id, checkIn, checkOut, adults, children, childAges, rooms }, { scenario });
    return Response.json(response, { headers: noStore });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502, headers: noStore });
  }
}
