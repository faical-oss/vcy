import type { ReactNode } from "react";
import { SunOrnament } from "@/components/brand/sun-ornament";
import { Container } from "@/components/ui/container";

/**
 * Shared body of the "not found" and "something went wrong" pages, so both look the same: ornament, small label, the page's
 * one `h1`, a short message, then the actions (primary button first) and an optional block of links. It is a section, not a
 * `main`: the site layout (or the root layout, for the error page) provides the landmark.
 */
export function StatusPage({ label, title, message, actions, children }: { label: string; title: string; message: string; actions: ReactNode; children?: ReactNode }) {
  return (
    <div className="bg-surface">
      <Container className="flex flex-col items-center py-16 text-center sm:py-24">
        <SunOrnament className="mb-4 h-6 w-[97px] text-muted-blue" />
        <p className="text-eyebrow font-semibold uppercase text-muted-blue">{label}</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-medium text-primary sm:text-title-lg">{title}</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-body">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
        {children}
      </Container>
    </div>
  );
}
