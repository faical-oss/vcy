import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SunOrnament } from "@/components/brand/sun-ornament";
import { Container } from "@/components/ui/container";
import { SectionTag } from "@/components/ui/section-tag";
import type { Moment, Testimonial } from "@/interfaces";

/** "Rachel T." -> "RT". */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Stars() {
  return (
    <div role="img" aria-label="5 out of 5 stars" className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-[13px] fill-star text-star" aria-hidden />
      ))}
    </div>
  );
}

export function TestimonialsSection({ testimonials, moments }: { testimonials: Testimonial[]; moments: Moment[] }) {
  return (
    <section aria-labelledby="testimonials-title" className="bg-surface py-14">
      <Container>
        <div className="mb-10 flex flex-col items-center text-center">
          <SunOrnament className="mb-3 h-6 w-[97px]" />
          <p className="mb-3 text-eyebrow font-semibold uppercase text-muted-blue">Traveller stories</p>
          <h2 id="testimonials-title" className="font-display text-title font-medium text-primary">
            What Our Travellers Say
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id} className="flex flex-col gap-4 self-stretch border border-card-border bg-card p-6">
              <Stars />
              <blockquote className="flex-1 text-sm italic leading-[22.75px] text-quote">{`"${t.quote}"`}</blockquote>
              <div className="flex items-center gap-3 border-t border-divider pt-3">
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full border border-avatar-border bg-avatar text-xs font-semibold text-primary">
                  {initials(t.author)}
                </span>
                <p>
                  <span className="block text-sm font-medium leading-5 text-primary">{t.author}</span>
                  <span className="block text-xs leading-4 text-muted">{t.trip}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 border-t border-border pt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <SectionTag className="mb-1">#VacayouMoments</SectionTag>
            {/* TODO: real social-share target. */}
            <Link href="#" className="border-b border-primary pb-px text-xs font-medium leading-4 text-primary transition-colors hover:border-primary/60 hover:text-primary/60">
              Share your experience
            </Link>
          </div>
          {/* Swipe / scroll strip: no arrows. Tiles snap so none is cut off at the start edge. */}
          {/* Focusable so the strip can be scrolled with the keyboard (its tiles are pictures only). */}
          <ul tabIndex={0} aria-label="Vacayou moments" className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {moments.map((moment) => (
              <li key={moment.id} className="relative aspect-square w-[calc((100%-24px)/4)] shrink-0 snap-start overflow-hidden sm:w-[calc((100%-56px)/8)]">
                <Image src={moment.imageSrc} alt={moment.alt} fill sizes="(min-width: 640px) 12vw, 25vw" className="object-cover transition-transform duration-300 hover:scale-105" />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
