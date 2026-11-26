/** The route's h1. Visually hidden: the welcome band and the section headings already carry the visible titles. */
export function AccountPageTitle({ title }: { title: string }) {
  return <h1 className="sr-only">{title}</h1>;
}
