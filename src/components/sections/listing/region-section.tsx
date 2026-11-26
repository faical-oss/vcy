import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/helpers/cn";

interface RegionSectionProps {
  /** id of the heading; names the section. */
  id: string;
  /** "plain" (default) is white; "soft" is the off-white band, unused for now. */
  tone?: "plain" | "soft";
  tag: string;
  title: string;
  /** Without it the section has no "All ..." link. */
  link?: { label: string; href: string };
  children: ReactNode;
}

/** Full-width section of a region page: eyebrow, heading, the cards, then an underlined "All ..." link on the right. */
export function RegionSection({ id, tone = "plain", tag, title, link, children }: RegionSectionProps) {
  return (
    <section aria-labelledby={id} className={cn("py-14", tone === "soft" ? "bg-surface" : "bg-card")}>
      <Container className="px-6">
        <SectionHeading id={id} tag={tag} title={title} titleClassName="text-heading" />
        <div className="mt-7">{children}</div>
        {link ? (
          <div className="mt-6 flex justify-end">
            <ButtonLink href={link.href} variant="link" size="inline" className="uppercase tracking-nav">
              {link.label} <ArrowRight className="size-3.5" aria-hidden />
            </ButtonLink>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
