import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { NavItemLink } from "@/components/layout/nav-item-link";
import { SunOrnament } from "@/components/brand/sun-ornament";
import { Container } from "@/components/ui/container";
import type { EditorialQuote } from "@/interfaces";

export function EditorialBanner({
  eyebrow,
  quote,
  attribution,
  ctaLabel,
  href,
  external,
  imageSrc,
  imageAlt = "Wellness traveller story",
}: EditorialQuote) {
  return (
    <section
      aria-label="Traveller story"
      className="bg-primary text-primary-foreground"
    >
      <Container className="flex flex-col items-center gap-6 py-10 md:flex-row">
        <div className="flex-1">
          <SunOrnament className="mb-3" />
          <p className="text-micro uppercase tracking-widest text-muted-blue">
            {eyebrow}
          </p>
          <blockquote className="mt-2 max-w-xl font-display text-title font-medium text-white">
            {quote}
          </blockquote>
          <p className="mt-2 text-sm text-white/60">{attribution}</p>
          {href && ctaLabel ? (
            <NavItemLink
              href={href}
              external={external}
              className="mt-5 inline-flex items-center gap-2 border-b border-muted-blue pb-px text-sm font-medium text-muted-blue transition-colors hover:border-white hover:text-white"
            >
              {ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
            </NavItemLink>
          ) : null}
        </div>
        {imageSrc ? (
          <div className="relative aspect-[4/3] w-full shrink-0 md:w-80">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
