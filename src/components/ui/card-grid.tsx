import type { ReactNode } from "react";
import { LISTING_GRID, TILE_GRID } from "@/constants/grids";
import { cn } from "@/helpers/cn";

interface CardGridProps {
  /** "listing": hotel, experience and package cards (1 / 2 / 3 columns). "tiles": destination, region and country tiles (1 / 2 / 3 / 4). */
  kind?: "listing" | "tiles";
  /** A list of cards is a `ul` whose children are `li`. */
  as?: "div" | "ul";
  children: ReactNode;
  className?: string;
}

/** The one card grid of the site (see `src/constants/grids.ts` for the column counts). Cards in a row share the tallest height. */
export function CardGrid({ kind = "listing", as: Tag = "div", children, className }: CardGridProps) {
  return (
    <Tag data-grid={kind} className={cn(kind === "tiles" ? TILE_GRID : LISTING_GRID, className)}>
      {children}
    </Tag>
  );
}
