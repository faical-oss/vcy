import type { NavLink, NavMenu } from "@/interfaces";

/**
 * One link per header menu for the "not found" page: the menu's own page, else its first group page, else its first
 * internal link. Built from the navigation data, so a link can only point at a page the header also links to (the
 * navigation tests check those resolve). External links are skipped. A menu with nothing internal is left out.
 */
export function sectionLinks(menus: readonly NavMenu[]): NavLink[] {
  return menus.flatMap((menu) => {
    const href = menu.href ?? menu.groups.find((group) => group.href)?.href ?? menu.groups.flatMap((group) => group.links).find((link) => !link.external)?.href;
    return href ? [{ label: menu.label, href }] : [];
  });
}
