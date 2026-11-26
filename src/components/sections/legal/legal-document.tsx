import { cn } from "@/helpers/cn";
import type { LegalDocument as LegalDocumentData } from "@/interfaces";
import { LegalPage } from "./legal-page";
import { LegalSection } from "./legal-section";

/** Renders a full legal document (title, date, numbered sections) from data. */
export function LegalDocument({ document }: { document: LegalDocumentData }) {
  return (
    <LegalPage title={document.title} updated={document.updated}>
      {document.sections.map((section) => (
        <LegalSection key={section.id} id={section.id} heading={section.heading}>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>
              {paragraph.map((segment, segmentIndex) => (
                <span key={segmentIndex} className={cn(segment.emphasis && "font-medium text-primary")}>
                  {segment.text}
                </span>
              ))}
            </p>
          ))}
        </LegalSection>
      ))}
    </LegalPage>
  );
}
