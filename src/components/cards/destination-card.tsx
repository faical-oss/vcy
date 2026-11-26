import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { TILE_ASPECT } from "@/constants/grids";
import { cn } from "@/helpers/cn";

interface DestinationCardProps {
  name: string;
  region: string;
  experienceCount?: number;
  /** Replaces "<n>+ experiences" (e.g. "90+ adventures"). */
  countLabel?: string;
  /** Without it the tile is not a link: no hover state and no pointer. */
  href?: string;
  imageSrc?: string;
  /** "home" is the Home page caption; "listing" is the destination pages' one (reference: translucent blurred panel, serif name, region and count on one row). */
  variant?: "home" | "listing";
  className?: string;
}

/**
 * Photo tile with a white caption panel (Figma DestinationCard, 296x296): square from 560px, 4:3 when it is alone in the row (`TILE_ASPECT`),
 * never a fixed height, so it keeps its shape in every column count. The caption is at most about 40% of the tile (two lines of text
 * plus padding, never more than three), and the photo is framed from the upper third so the caption covers the foreground, not the subject.
 */
export function DestinationCard({ name, region, experienceCount, countLabel, href, imageSrc, variant = "home", className }: DestinationCardProps) {
  const count = countLabel ?? `${experienceCount}+ experiences`;
  const classes = cn(
    "group relative block overflow-hidden border border-border bg-surface-blue",
    TILE_ASPECT,
    href && "transition-colors duration-200 hover:border-primary",
    className,
  );
  const content = (
    <>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 560px) 50vw, 100vw"
          className={cn("object-cover object-[50%_35%]", href && "transition-transform duration-300 group-hover:scale-105")}
        />
      ) : (
        <ImagePlaceholder className="absolute inset-0" />
      )}
      {variant === "listing" ? (
        <div className="absolute inset-x-3 bottom-3 bg-card/95 p-3 backdrop-blur-sm">
          <p className="font-display text-title-sm font-semibold leading-none text-primary">{name}</p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="text-micro font-semibold uppercase tracking-widest text-body">{region}</p>
            <p className="text-caption text-muted-blue">{count}</p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-x-3 bottom-3 border border-border bg-card p-[9px]">
          <p className="text-base font-medium leading-5 text-primary">{name}</p>
          <p className="text-eyebrow normal-case leading-4 tracking-normal text-primary">{region}</p>
          <p className="mt-0.5 text-xs leading-4 text-muted-blue">{count}</p>
        </div>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
