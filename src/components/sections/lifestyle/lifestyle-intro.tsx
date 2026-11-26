import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionTag } from "@/components/ui/section-tag";

/** Centred intro band under the hero: eyebrow, h2, one paragraph and a link to the listing. */
export function LifestyleIntro({ id, eyebrow, title, body, linkLabel, linkHref }: { id: string; eyebrow: string; title: string; body: string; linkLabel: string; linkHref: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[121px] md:scroll-mt-[185px] bg-surface py-14 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-[1024px] flex-col items-center text-center">
          <SectionTag>{eyebrow}</SectionTag>
          <h2 id={`${id}-title`} className="mt-3 font-display text-3xl font-medium text-primary sm:text-title-lg">
            {title}
          </h2>
          <p className="mt-6 max-w-[800px] text-base leading-8 text-body">{body}</p>
          <ButtonLink href={linkHref} variant="link" size="inline" className="mt-8">
            {linkLabel} <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
