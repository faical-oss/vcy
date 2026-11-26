"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/helpers/cn";

/** What marks the chosen item of a row: a pressed chip, the current link, the selected tab. */
const ACTIVE = '[aria-pressed="true"],[aria-current]:not([aria-current="false"]),[aria-selected="true"],[data-active="true"]';
const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
/** Width of the fade at a row's edge: wide enough to cut the next chip in half, so it reads as "more this way". */
const FADE = 28;

interface ScrollRowProps extends Omit<ComponentProps<"div">, "ref"> {
  /** The element to render: `ul` or `ol` for a list of chips (its children are `li`), `div` for a group or a tablist. */
  as?: "div" | "ul" | "ol";
  /** true (default): the row wraps from `lg` (1024px). false: it scrolls at every width (tabs and links that never wrap). */
  wrap?: boolean;
}

/**
 * One line of chips, pills, badges or tabs. Below `lg` it never wraps: it scrolls sideways (scrollbar hidden), the edges fade
 * where there is more, and the chosen item (`aria-pressed`, `aria-current`, `aria-selected` or `data-active`) is scrolled into view
 * on load and whenever it changes. From `lg` it wraps like a normal row. The row's own height does not change: its 8px of vertical
 * padding (room for the 44px tap area of a 30px chip and the focus ring, which a scroll container would clip) is cancelled by a
 * -8px margin, so a caller that sets a top margin writes it as `mt-[calc(<space>-8px)]`.
 * Keyboard: the items are the focus stops and the browser scrolls a focused one into view; a row with nothing focusable in it
 * (plain badges) becomes a focus stop itself while it scrolls, so it can be moved with the arrow keys.
 */
export function ScrollRow({ as: Tag = "div", wrap = true, className, children, ...props }: ScrollRowProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const row = ref.current;
    if (!row) return;

    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      row.style.setProperty("--fade-l", max > 1 && row.scrollLeft > 1 ? `${FADE}px` : "0px");
      row.style.setProperty("--fade-r", max > 1 && row.scrollLeft < max - 1 ? `${FADE}px` : "0px");
      // A scrollable region needs a keyboard way in: its items when it has any, else itself.
      const alone = max > 1 && !row.querySelector(FOCUSABLE);
      if (alone) row.tabIndex = 0;
      else if (row.dataset.focusSelf) row.removeAttribute("tabindex");
      if (alone) row.dataset.focusSelf = "1";
      else delete row.dataset.focusSelf;
    };

    const reveal = (smooth: boolean) => {
      const item = row.querySelector<HTMLElement>(ACTIVE);
      if (!item || row.scrollWidth - row.clientWidth <= 1) return;
      const rowBox = row.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();
      const left = row.scrollLeft + (itemBox.left - rowBox.left) - (row.clientWidth - itemBox.width) / 2;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      row.scrollTo?.({ left: Math.max(0, left), behavior: smooth && !reduced ? "smooth" : "auto" });
    };

    update();
    reveal(false);
    row.addEventListener("scroll", update, { passive: true });
    // jsdom has no ResizeObserver; a browser always does.
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resize?.observe(row);
    const mutate = new MutationObserver((records) => {
      update();
      if (records.some((record) => record.type === "attributes")) reveal(true);
    });
    mutate.observe(row, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-pressed", "aria-current", "aria-selected", "data-active"] });
    return () => {
      row.removeEventListener("scroll", update);
      resize?.disconnect();
      mutate.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-scroll-row={wrap ? "wrap" : "scroll"}
      className={cn(
        "-my-2 flex gap-2 overflow-x-auto overscroll-x-contain py-2 scroll-px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0",
        "[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-l,0px),#000_calc(100%-var(--fade-r,0px)),transparent)]",
        wrap && "lg:flex-wrap lg:overflow-visible lg:[mask-image:none]",
        className,
      )}
      {...(props as object)}
    >
      {children}
    </Tag>
  );
}
