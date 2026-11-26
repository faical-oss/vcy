/** Renders one JSON-LD object (from `src/features/seo/json-ld.ts`) as a script tag. `<` is escaped so data cannot close the tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
