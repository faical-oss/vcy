import { cva, type VariantProps } from "class-variance-authority";
import Image from "next/image";
import type { ReactNode } from "react";
import { SunOrnament } from "@/components/brand/sun-ornament";
import { Container } from "@/components/ui/container";
import { cn } from "@/helpers/cn";
import type { BreadcrumbItem } from "@/interfaces";
import { ListingBreadcrumb, type BreadcrumbVariant } from "./listing-breadcrumb";

const heroVariants = cva("relative w-full overflow-hidden bg-primary", {
  variants: {
    /** "compact" is the category page hero; "tall" the destination and region page hero; "index" the All Destinations hero. */
    size: { compact: "h-[260px]", tall: "h-[340px]", index: "h-[340px]", /** Lifestyle landing pages: taller, copy centred, two actions. */ feature: "h-[520px] md:h-[560px]" },
  },
  defaultVariants: { size: "compact" },
});

const heroParts = {
  compact: { content: "pb-6", title: "text-listing-title", subtitle: "mt-2 text-base text-white/90" },
  tall: { content: "px-6 pb-8", title: "text-destination-title", subtitle: "mt-1 text-sm text-white/75" },
  index: { content: "px-6 pb-12", title: "text-4xl sm:text-display-sm", subtitle: "mt-3 text-base text-white/90" },
  feature: { content: "justify-center", title: "max-w-2xl whitespace-pre-line text-4xl sm:text-display", subtitle: "mt-4 max-w-2xl text-base text-white/85 sm:text-lg" },
} as const;

export interface ListingHeroProps extends VariantProps<typeof heroVariants> {
  title: string;
  crumbs: BreadcrumbItem[];
  /** Accessible name of the breadcrumb `nav`. */
  breadcrumbLabel: string;
  breadcrumbVariant?: BreadcrumbVariant;
  subtitle?: string;
  /** Small uppercase line above the title. */
  eyebrow?: string;
  /** Sunrise ornament between the breadcrumb and the title. */
  ornament?: boolean;
  /** Buttons under the subtitle (the "feature" size). */
  actions?: ReactNode;
  /** Decorative background photo. Without one the hero is a flat brand colour. */
  image?: string;
  /** Alt text of the photo; without it the photo is decorative. */
  imageAlt?: string;
  className?: string;
}

/** Image hero for listing pages: breadcrumb, the page `h1` and an optional subtitle over a darkened photo. */
export function ListingHero({ title, crumbs, breadcrumbLabel, breadcrumbVariant, subtitle, eyebrow, ornament, image, imageAlt, size, actions, className }: ListingHeroProps) {
  const parts = heroParts[size ?? "compact"];
  return (
    <section className={cn(heroVariants({ size }), className)}>
      {image ? <Image src={image} alt={imageAlt ?? ""} fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" /> : null}
      <div aria-hidden className="absolute inset-0 bg-overlay" />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-overlay to-transparent" />
      <Container className={cn("absolute inset-0 flex flex-col", size === "feature" ? "" : "justify-end", parts.content)}>
        <ListingBreadcrumb crumbs={crumbs} label={breadcrumbLabel} variant={breadcrumbVariant} />
        {ornament ? <SunOrnament className="mb-2.5 h-6 w-[97px] text-white" /> : null}
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-eyebrow-lg text-white">{eyebrow}</p> : null}
        <h1 className={cn("font-display font-medium text-white", parts.title)}>{title}</h1>
        {subtitle ? <p className={parts.subtitle}>{subtitle}</p> : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </Container>
    </section>
  );
}
