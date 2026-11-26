import type { ReactNode } from "react";

/** One numbered block of a legal document: a heading followed by its paragraphs. */
export function LegalSection({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mb-8 last:mb-0">
      <h2 id={`${id}-heading`} className="mb-3 text-base font-medium leading-6 text-primary">
        {heading}
      </h2>
      <div className="space-y-3 text-sm leading-[22.75px] text-body">{children}</div>
    </section>
  );
}
