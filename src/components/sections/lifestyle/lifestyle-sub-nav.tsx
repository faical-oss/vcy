import { Container } from "@/components/ui/container";
import { ScrollRow } from "@/components/ui/scroll-row";

export interface SubNavItem {
  label: string;
  /** Id of the section the link scrolls to. */
  id: string;
}

/** Thin bar under the hero with in-page anchors. Sticks under the site header, and under the docked search bar while that shows (`--docked-search-h`); the target sections use `scroll-mt-[121px] md:scroll-mt-[185px]` (64px header + 57px bar, + 64px for the search bar from md up). */
export function LifestyleSubNav({ items, label }: { items: SubNavItem[]; label: string }) {
  return (
    <nav aria-label={label} className="sticky top-[calc(var(--spacing-header)+var(--docked-search-h))] z-30 border-b border-border bg-card/95 backdrop-blur-sm transition-[top] duration-200 motion-reduce:transition-none">
      <Container>
        <ScrollRow as="ul" wrap={false} className="-mx-4 gap-6 px-4 py-0 sm:mx-0 sm:px-0">
          {items.map((item) => (
            <li key={item.id} className="flex">
              <a href={`#${item.id}`} className="-mb-px flex h-14 items-center whitespace-nowrap border-b-2 border-transparent text-xs font-medium uppercase tracking-[0.0917em] text-body transition-colors hover:border-accent hover:text-primary focus-visible:border-accent focus-visible:text-primary">
                {item.label}
              </a>
            </li>
          ))}
        </ScrollRow>
      </Container>
    </nav>
  );
}
