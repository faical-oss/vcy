import type { RoomAvailabilityRequest, RoomAvailabilityResponse } from "@/interfaces";

/**
 * The room availability call, as the browser makes it: one function for hotels and experiences. Today it talks to our own
 * route (`/api/rooms/availability`), which is backed by the mock service; `mock` forwards the dev-only `?mock=` scenario.
 * TODO(api): point this at the real availability endpoint (or keep the route as the backend-for-frontend) once the contract is
 * known. No server code and no mock is imported here, so the browser bundle stays free of both.
 */
export async function getRoomAvailability(request: RoomAvailabilityRequest, options: { signal?: AbortSignal; mock?: string | null } = {}): Promise<RoomAvailabilityResponse> {
  const params = new URLSearchParams({
    type: request.kind,
    id: request.id,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    adults: String(request.adults),
    children: String(request.children),
    rooms: String(request.rooms),
  });
  if (request.childAges.length > 0) params.set("childAges", request.childAges.join(","));
  if (options.mock) params.set("mock", options.mock);
  const response = await fetch(`/api/rooms/availability?${params.toString()}`, { signal: options.signal, headers: { accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`room availability failed: ${response.status}`);
  return (await response.json()) as RoomAvailabilityResponse;
}
