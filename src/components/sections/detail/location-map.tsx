import { ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/helpers/cn";

/**
 * Static map placeholder shared by the detail pages: a grid, a pin with the place name, a white card with the venue name in
 * the corner and an "Open in Maps" link that opens `mapUrl` in a new tab. No map provider is decided (key, privacy, CSP).
 * `className` sets the height (token gap: 380px on hotels, 260px on experiences).
 */
export function LocationMap({ name, label, place, mapUrl, className }: { name: string; label: string; place: string; mapUrl: string; className?: string }) {
  return (
    <div
      className={cn("relative h-[380px] overflow-hidden border border-border bg-surface-blue", className)}
      style={{ backgroundImage: "linear-gradient(var(--color-border-soft) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-soft) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
    >
      <div className="absolute left-4 top-4 bg-card px-3 py-2 shadow-card">
        <p className="text-xs font-semibold text-primary">{name}</p>
        <p className="text-xs text-body">{label}</p>
      </div>
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
        <MapPin className="size-6 fill-muted-blue text-muted-blue" aria-hidden />
        <p className="text-micro uppercase tracking-widest text-muted-blue">{place}</p>
      </div>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-card px-3 py-2 text-xs font-medium text-primary shadow-card hover:bg-surface">
        Open in Maps <ExternalLink className="size-3" aria-hidden />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}
