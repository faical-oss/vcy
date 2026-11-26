import type { ReactNode } from "react";
import { SunOrnament } from "@/components/brand/sun-ornament";

/** Home hero: looping video behind centred copy, with the search panel overlapping its bottom edge. `search` is a slot so the shared HeroSearch can drop in later. */
export function Hero({ search }: { search: ReactNode }) {
  return (
    <section aria-labelledby="hero-title" className="relative z-30">
      <div className="relative h-[260px] w-full md:h-[310px]">
        <video
          src="/videos/hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="size-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-overlay" />
        <div className="absolute inset-0 flex -translate-y-6 flex-col items-center justify-center px-4 text-center sm:-translate-y-10">
          <SunOrnament className="mb-3 sm:mb-4" />
          <p className="mb-3 text-eyebrow font-semibold uppercase text-muted-blue sm:mb-4">Curated Wellness Travel</p>
          <h1 id="hero-title" className="mb-2 max-w-2xl font-display text-3xl font-normal leading-tight text-white sm:mb-3 sm:text-4xl md:text-display">
            Travel That Moves You.
          </h1>
          <p className="hidden max-w-xl text-base text-white/90 sm:block">
            Wellness retreats, active adventures and curated travel — tailored to you.
          </p>
        </div>
      </div>
      <div className="relative z-30 mx-auto w-full max-w-[1100px] -translate-y-[30px] px-4 pb-4 md:-translate-y-[50px] md:px-6 md:pb-0">{search}</div>
    </section>
  );
}
