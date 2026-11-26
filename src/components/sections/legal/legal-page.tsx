import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { LegalBreadcrumb } from "./legal-breadcrumb";

/** Legal document layout: breadcrumb bar, then a narrow reading column with title, "last updated" line and sections. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <LegalBreadcrumb label={title} />
      <Container className="py-12">
        <div className="mx-auto max-w-[812px]">
          <h1 className="mb-2 font-display text-4xl font-medium text-primary">{title}</h1>
          <p className="mb-10 text-xs leading-4 text-muted-blue">{updated}</p>
          {children}
        </div>
      </Container>
    </>
  );
}
