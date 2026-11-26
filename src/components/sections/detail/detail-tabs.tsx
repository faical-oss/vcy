"use client";

import { ScrollRow } from "@/components/ui/scroll-row";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/helpers/cn";

export interface DetailTab {
  /** Also the URL hash (`#rooms`). */
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Tab bar with one panel per tab. Every panel is rendered on the server (so the content is in the HTML for search
 * engines); only the active one is visible. The active tab follows the URL hash, so `#rooms` opens Rooms.
 */
export function DetailTabs({ tabs, label, scrollOnSelect = false }: { tabs: DetailTab[]; label: string; scrollOnSelect?: boolean }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0].id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const root = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const activeRef = useRef(tabs[0].id);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (!tabs.some((tab) => tab.id === id)) return;
      const changed = id !== activeRef.current;
      activeRef.current = id;
      setActive(id);
      // A tab chosen after load (a link to "#rooms") brings the tab bar just under the header. Not on the first read of the URL,
      // and not when the hash only comes back to the tab that is already open (the photo gallery closing).
      if (scrollOnSelect && !first.current && changed) root.current?.scrollIntoView?.({ block: "start" });
    };
    fromHash();
    first.current = false;
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs, scrollOnSelect]);

  function select(id: string) {
    setActive(id);
    activeRef.current = id;
    window.history.replaceState(null, "", `#${id}`);
    if (scrollOnSelect) root.current?.scrollIntoView?.({ block: "start" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + step + tabs.length) % tabs.length;
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    select(tabs[target].id);
    refs.current[tabs[target].id]?.focus();
  }

  return (
    <div ref={root} className="scroll-mt-[calc(var(--spacing-header)+var(--docked-search-h))]">
      <div className="sticky top-[calc(var(--spacing-header)+var(--docked-search-h))] z-20 bg-card shadow-[0_3px_3px_-3px_rgb(0_0_0/0.2)]">
      <ScrollRow role="tablist" aria-label={label} wrap={false} className="gap-0 py-0 -my-0">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => select(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "shrink-0 border-b-2 px-2.5 py-4 text-sm transition-colors sm:px-5",
              active === tab.id ? "border-primary font-medium text-primary" : "border-transparent text-body hover:text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </ScrollRow>
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${base}-panel-${tab.id}`} aria-labelledby={`${base}-tab-${tab.id}`} hidden={active !== tab.id} className="pt-6">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
