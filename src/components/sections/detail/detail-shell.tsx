import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

interface DetailShellProps {
  /** Breadcrumb, badges, H1, location line and the action buttons. */
  header: ReactNode;
  gallery: ReactNode;
  /** The tab bar with its panels (`DetailTabs`). */
  tabs: ReactNode;
  /** Sticky booking box, shown from `lg`. */
  aside: ReactNode;
  /** Below `lg`: the bottom bar with the booking sheet (`MobileBookingBar`). */
  mobileBar?: ReactNode;
  /** Optional row below the columns (e.g. "Similar hotels"). */
  similar?: ReactNode;
}

/**
 * Generic detail page shell: header, then a content column (gallery and tabs) beside a sticky booking box, then an optional
 * row of similar items. The page reads header, gallery, tabs at every width, in DOM order: no CSS reordering of the blocks. (The
 * header starts with the Back, Favorite and Share row below `md`; see `DetailHeader`.) Below `lg` the booking box moves into a
 * bottom bar and sheet. Hotels, packages and experiences use it. Column widths follow the design at 1512px: 872px content, 22px gap,
 * 338px box (token gap: no spacing token for 22px and 338px). The docked search bar (a pill below `xl`) is there from the first pixel (4rem under the
 * header): the page reserves it (`pt-[5.5rem]`) and the sticky box and tabs sit under it (`--docked-search-h`).
 */
export function DetailShell({ header, gallery, tabs, aside, mobileBar, similar }: DetailShellProps) {
  return (
    <>
      <Container className="pb-12 pt-[5.5rem]">
        <div data-detail="header">{header}</div>
        <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_338px] lg:items-start lg:gap-8 lg:gap-x-[22px]">
          <div className="min-w-0">
            <div data-detail="gallery" className="min-w-0">{gallery}</div>
            <div data-detail="tabs" className="mt-8 min-w-0">{tabs}</div>
          </div>
          <div className="hidden lg:sticky lg:top-[calc(var(--spacing-header)+var(--docked-search-h)+1rem)] lg:z-30 lg:block">{aside}</div>
        </div>
      </Container>
      {similar ? <div className="bg-surface py-12">{similar}</div> : null}
      {mobileBar ? <div className="h-[var(--booking-bar-h)] lg:hidden" aria-hidden /> : null}
      {mobileBar}
    </>
  );
}
