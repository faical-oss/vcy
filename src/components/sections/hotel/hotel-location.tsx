import { MapPin } from "lucide-react";
import { LocationMap } from "@/components/sections/detail/location-map";
import type { HotelDetail } from "@/interfaces";

/**
 * Location tab: a static map placeholder (grid, pin, place name and a white card with the hotel), four facts and the
 * nearby attractions. No map provider is decided (key, privacy and CSP), so the "map" is a drawing; "Open in Maps" opens
 * the coordinates in OpenStreetMap in a new tab.
 */
export function HotelLocation({ hotel }: { hotel: HotelDetail }) {
  const { lat, lng } = hotel.location.coordinates;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
  return (
    <section aria-labelledby="location-heading" className="space-y-8">
      <h2 id="location-heading" className="font-display text-title-sm font-medium text-primary">
        Location
      </h2>
      <LocationMap name={hotel.name} label={hotel.location.label} place={`${hotel.location.city}, ${hotel.location.country}`} mapUrl={mapUrl} />
      <dl className="grid gap-x-10 sm:grid-cols-2">
        {hotel.transport.map(({ label, value }) => (
          <div key={label} className="flex gap-6 border-b border-border py-3 text-sm">
            <dt className="w-32 shrink-0 text-muted-blue">{label}</dt>
            <dd className="text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="font-display text-title-sm font-medium text-primary">Nearby attractions</h3>
        <ul className="mt-3 grid gap-x-10 sm:grid-cols-2">
          {hotel.attractions.map(({ label, value }) => (
            <li key={label} className="flex items-center gap-3 border-b border-border py-3 text-sm text-primary">
              <MapPin className="size-4 shrink-0 text-muted-blue" aria-hidden />
              <span>
                {label} · {value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
