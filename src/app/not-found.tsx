import { NotFoundContent } from "@/components/sections/status/not-found-content";
import { getNavigation } from "@/features/navigation/get-navigation";
import { sectionLinks } from "@/features/navigation/section-links";
import SiteLayout from "./(site)/layout";

/**
 * The 404 page for URLs that match no route. A root `not-found` sits above the `(site)` layout, so it brings the layout
 * (header, footer) itself; unknown slugs inside the site use `(site)/not-found.tsx`, which shows the same content.
 * Next sends the real 404 status and a noindex robots tag; the page has one `h1`.
 */
export default async function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent links={sectionLinks(await getNavigation())} />
    </SiteLayout>
  );
}
