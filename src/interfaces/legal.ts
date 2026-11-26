/** A run of text inside a legal paragraph; `emphasis` renders it medium weight in the heading color. */
export interface LegalSegment {
  text: string;
  emphasis?: boolean;
}

export type LegalParagraph = readonly LegalSegment[];

export interface LegalSectionData {
  id: string;
  heading: string;
  paragraphs: readonly LegalParagraph[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  sections: readonly LegalSectionData[];
}
