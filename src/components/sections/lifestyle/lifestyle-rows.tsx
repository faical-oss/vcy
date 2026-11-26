import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionTag } from "@/components/ui/section-tag";
import { cn } from "@/helpers/cn";
import type { LifestyleRow } from "@/interfaces";

/** Section heading and three rows of photo + text, the photo alternating left and right from `md`. Anchor target of the sub-nav ("why"). */
export function LifestyleRows({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: LifestyleRow[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[121px] md:scroll-mt-[185px] py-14 sm:py-24">
      <Container>
        <div className="mx-auto max-w-[1120px]">
          <SectionTag>{eyebrow}</SectionTag>
          <h2 id={`${id}-title`} className="mt-3 font-display text-3xl font-medium text-primary sm:text-title-lg">
            {title}
          </h2>
          <ul className="mt-10 flex flex-col gap-12 md:mt-16 md:gap-24">
            {items.map((item, index) => (
              <li key={item.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-16">
                <div className={cn("relative aspect-square w-full overflow-hidden rounded-xl bg-surface-blue", index % 2 === 1 && "md:order-2")}>
                  <Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 1280px) 504px, (min-width: 768px) 45vw, 100vw" className="object-cover" />
                </div>
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-eyebrow-lg text-accent">{item.eyebrow}</p>
                  <h3 className="mt-3 font-display text-3xl font-medium text-primary sm:text-title">{item.title}</h3>
                  <p className="mt-4 text-[15px] leading-8 text-body">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
