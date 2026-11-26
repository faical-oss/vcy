import Link from "next/link";
import { pillClassName, type PillTone } from "@/components/ui/pill";
import { ScrollRow } from "@/components/ui/scroll-row";
import { cn } from "@/helpers/cn";

export interface FilterChip {
  label: string;
  href: string;
  active: boolean;
}

interface FilterChipsProps {
  chips: FilterChip[];
  /** Accessible name of the `nav`. */
  label: string;
  /** Inactive chip look: "outline" (default) or the borderless "soft" fill. */
  tone?: PillTone;
}

/**
 * Filter chips as real links, so filtering works without client JavaScript. One scrolling row (`ScrollRow`) below `lg`, wrapping
 * from `lg`; the current chip is scrolled into view.
 */
export function FilterChips({ chips, label, tone }: FilterChipsProps) {
  return (
    <div className="flow-root">
      <nav aria-label={label}>
        <ScrollRow as="ul">
          {chips.map((chip) => (
            <li key={chip.href} className="flex">
              <Link
                href={chip.href}
                scroll={false}
                aria-current={chip.active ? "true" : undefined}
                className={cn(
                  pillClassName(chip.active, tone),
                  "relative inline-flex items-center after:absolute after:inset-x-0 after:-inset-y-[5px] after:content-['']",
                )}
              >
                {chip.label}
              </Link>
            </li>
          ))}
        </ScrollRow>
      </nav>
    </div>
  );
}
