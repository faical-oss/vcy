import { Check } from "lucide-react";
import Image from "next/image";
import { PICK_GRID_SIZES } from "@/constants/grids";
import { cn } from "@/helpers/cn";

interface ActivityTileProps {
  label: string;
  /** Local photo path, or undefined for the neutral gradient. */
  src?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * One photo tile you pick, in the wizard's activity step. A native checkbox inside a label, so Space toggles it, the label is
 * its name, and the whole tile is the tap target. The checkbox is visually hidden: the tile draws the states. Selected = gold
 * ring plus a check badge (never colour alone); keyboard focus = a second, offset ring. The label sits on a dark scrim at the
 * bottom, so white text keeps 4.5:1 even over a white photo (worst case over the 20 placeholder photos 5.2:1, two-line label on the smallest tile). `touch-manipulation` removes the double-tap
 * zoom; `select-none` stops a scroll from selecting the text.
 */
export function ActivityTile({ label, src, checked, onCheckedChange }: ActivityTileProps) {
  return (
    <label className="group relative block aspect-[16/10] min-h-11 cursor-pointer touch-manipulation select-none overflow-hidden rounded-card bg-gradient-to-br from-primary to-muted-blue">
      <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="peer sr-only" />
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={PICK_GRID_SIZES}
          loading="lazy"
          className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
        />
      ) : null}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-colors group-hover:from-black/85 group-active:from-black/90 motion-reduce:transition-none" />
      <span className="absolute inset-x-2 bottom-2.5 text-center text-sm font-semibold leading-tight text-white">{label}</span>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-card border-2 border-transparent transition-colors motion-reduce:transition-none",
          "peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-inset peer-checked:ring-accent",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-opacity motion-reduce:transition-none",
          checked ? "opacity-100" : "opacity-0",
        )}
      >
        <Check className="size-4" />
      </span>
    </label>
  );
}
