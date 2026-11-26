import { NotFoundContent } from "@/components/sections/status/not-found-content";
import { getNavigation } from "@/features/navigation/get-navigation";
import { sectionLinks } from "@/features/navigation/section-links";

/** The 404 page for an unknown slug inside the site: the `(site)` layout (header, footer) is already around it. See `src/app/not-found.tsx` for URLs that match no route. */
export default async function SiteNotFound() {
  return <NotFoundContent links={sectionLinks(await getNavigation())} />;
}
