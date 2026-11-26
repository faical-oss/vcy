"use client";

import Image from "next/image";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { flushSync } from "react-dom";
import { Container } from "@/components/ui/container";
import { NAV_CONTENT } from "@/constants/navigation";
import { cn } from "@/helpers/cn";
import { slugify } from "@/helpers/slugify";
import type { NavMenu, NavMenuId } from "@/interfaces";
import { NavItemLink } from "./nav-item-link";

const NAV_BUTTON =
  "flex h-header items-center gap-1 border-b-2 px-2.5 text-eyebrow xl:px-4 font-semibold uppercase text-primary transition-colors";

const panelId = (id: NavMenuId) => `nav-panel-${id}`;
const isMega = (menu: NavMenu) =>
  menu.groups.length > 1 ||
  menu.featured !== undefined ||
  menu.layout === "columns";

/**
 * Desktop navigation, driven by `menus`. Menus with several groups or a featured card open a mega panel
 * (groups, links of the active group, featured card); the rest open a small dropdown. The mega panel is positioned against
 * the sticky <header>, so keep this inside it.
 *
 * An item only opens its dropdown, it never navigates: every trigger is a button, and every dropdown ends with a "View all"
 * link to its section (its groups have theirs). All the dropdowns, with every link of every group, are in the server HTML
 * (a closed one is `hidden`), so crawlers and a page without JavaScript still have them as real links.
 *
 * Mouse: opens on hover, closes 120ms after the pointer leaves; a click keeps it open. Touch: a tap opens it, a second tap closes
 * it; tapping outside closes. Keyboard: Enter, Space or ArrowDown opens it and moves focus into it; focus alone opens it; arrows
 * move between the links (and between the groups of a mega panel); Tab walks the items in visual order; Escape closes and
 * refocuses the trigger; blur-out closes. Mega panel groups with an `href` are real links: hover/focus previews their links,
 * click (or Enter) navigates and closes the panel; on touch the first tap previews and a second tap navigates.
 */
export function MainNav({ menus }: { menus: readonly NavMenu[] }) {
  const [openId, setOpenId] = useState<NavMenuId | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointerKind = useRef<string | null>(null);
  const restoringFocus = useRef(false);

  const open = (id: NavMenuId) => {
    clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const close = () => {
    clearTimeout(closeTimer.current);
    setOpenId(null);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };
  const openAndFocusPanel = (id: NavMenuId) => {
    flushSync(() => open(id));
    navRef.current
      ?.querySelector<HTMLElement>(
        `[id="${panelId(id)}"] :is(button, a[href]):not([tabindex="-1"])`,
      )
      ?.focus();
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!openId) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenId(null);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [openId]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>, menu: NavMenu) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openAndFocusPanel(menu.id);
    }
  };

  // A trigger never navigates. Keyboard (Enter, Space: `detail` is 0): open and move into the panel. Mouse: hover has opened it, so a
  // click keeps it open. Touch and pen: a tap opens it, the next one closes it.
  const onTriggerClick = (event: MouseEvent<HTMLElement>, id: NavMenuId, isOpen: boolean) => {
    const kind = pointerKind.current;
    pointerKind.current = null;
    if (event.detail === 0) openAndFocusPanel(id);
    else if (kind === "mouse") open(id);
    else if (isOpen) close();
    else open(id);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="hidden h-full lg:block"
      onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
      onPointerEnter={(e) =>
        e.pointerType === "mouse" && clearTimeout(closeTimer.current)
      }
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !openId) return;
        close();
        // Refocusing the trigger must not reopen the panel through its focus handler.
        restoringFocus.current = true;
        navRef.current
          ?.querySelector<HTMLElement>(`[data-nav-trigger="${openId}"]`)
          ?.focus();
        restoringFocus.current = false;
      }}
      onBlur={(e) => {
        if (!navRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <ul className="flex h-full items-center">
        {menus.map((menu) => {
          const { id, label } = menu;
          const mega = isMega(menu);
          const isOpen = openId === id;
          return (
            <li
              key={id}
              className={cn("flex h-header items-center", !mega && "relative")}
              onPointerEnter={(e) => e.pointerType === "mouse" && open(id)}
            >
              <button
                type="button"
                data-nav-trigger={id}
                aria-expanded={isOpen}
                aria-controls={panelId(id)}
                // Keyboard focus opens the panel; mouse and touch focus does not (hover and the first tap do).
                onFocus={(e) => !restoringFocus.current && e.currentTarget.matches(":focus-visible") && open(id)}
                onKeyDown={(e) => onTriggerKeyDown(e, menu)}
                onPointerDown={(e) => {
                  pointerKind.current = e.pointerType;
                }}
                onClick={(e) => onTriggerClick(e, id, isOpen)}
                className={cn(NAV_BUTTON, isOpen ? "border-primary" : "border-transparent hover:bg-surface")}
              >
                {label}
                <ChevronDown className={cn("size-3 text-muted-blue transition-transform duration-150", isOpen && "rotate-180")} aria-hidden />
              </button>
              {mega ? <MegaPanel menu={menu} open={isOpen} onNavigate={close} /> : <SimpleDropdown menu={menu} open={isOpen} onNavigate={close} />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** ArrowDown / ArrowUp move between the links of a list (`[data-nav-link]`), wrapping at the ends. */
function onLinksKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const links = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-nav-link]")].filter((link) => !link.closest("[hidden]"));
  const index = links.indexOf(document.activeElement as HTMLElement);
  if (index === -1) return;
  event.preventDefault();
  links[(index + (event.key === "ArrowDown" ? 1 : links.length - 1)) % links.length]?.focus();
}

function SimpleDropdown({
  menu,
  open,
  onNavigate,
}: {
  menu: NavMenu;
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <div
      id={panelId(menu.id)}
      hidden={!open}
      role="group"
      aria-label={menu.label}
      onKeyDown={onLinksKeyDown}
      className="absolute left-0 top-full z-50 min-w-[140px] border border-border bg-card py-1 shadow-lg"
    >
      {menu.groups
        .flatMap((group) => group.links)
        .map((link) => (
          <NavItemLink
            key={link.href}
            href={link.href}
            external={link.external}
            data-nav-link
            onClick={onNavigate}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-sm text-primary transition-colors hover:bg-surface"
          >
            {link.label}
          </NavItemLink>
        ))}
      {menu.footerLink ? (
        <NavItemLink
          href={menu.footerLink.href}
          external={menu.footerLink.external}
          data-nav-link
          onClick={onNavigate}
          className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-surface"
        >
          {menu.footerLink.label} <ArrowRight className="size-3.5" aria-hidden />
        </NavItemLink>
      ) : null}
    </div>
  );
}

/**
 * The links of every group are in the HTML: only the active group's list is shown (the others are `hidden`), and each list ends with
 * "View all <group>" when the group has a page.
 */
function MegaPanel({
  menu,
  open,
  onNavigate,
}: {
  menu: NavMenu;
  open: boolean;
  onNavigate: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewOnly = useRef(false);
  const { featured, footerLink } = menu;
  const columns = menu.layout === "columns";
  const id = panelId(menu.id);

  const focusGroup = (index: number) =>
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-nav-group="${index}"]`)
      ?.focus();

  // Groups are a roving-tabindex list: Tab reaches the active group, then its links; arrows move between groups.
  const onGroupKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    const count = menu.groups.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusGroup((index + (event.key === "ArrowDown" ? 1 : count - 1)) % count);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      panelRef.current?.querySelector<HTMLElement>(`[data-nav-links="${activeIndex}"] [data-nav-link]`)?.focus();
    }
  };

  const linkClass = "group flex items-center gap-1.5 py-1.5 text-sm text-primary transition-colors";
  const arrow = (
    <ChevronRight
      className="size-[11px] shrink-0 text-border transition-colors group-hover:text-muted-blue"
      aria-hidden
    />
  );

  return (
    <div
      ref={panelRef}
      id={id}
      hidden={!open}
      role="group"
      aria-label={menu.label}
      className="absolute left-0 top-full z-50 w-full border-y border-border bg-card shadow-xl"
    >
      <Container className="flex min-h-[300px] py-0">
        {columns ? (
          <div onKeyDown={onLinksKeyDown} className="grid flex-1 grid-cols-2 gap-x-8 px-8 py-6 first:pl-0">
            {menu.groups.map((group) => (
              <div key={group.title}>
                <p
                  id={`${id}-${slugify(group.title)}`}
                  className="mb-3 text-micro uppercase tracking-widest text-muted-blue"
                >
                  {group.title}
                </p>
                <ul
                  aria-labelledby={`${id}-${slugify(group.title)}`}
                  className="flex flex-col gap-1"
                >
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <NavItemLink href={link.href} external={link.external} data-nav-link onClick={onNavigate} className={linkClass}>
                        {arrow}
                        {link.label}
                      </NavItemLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {!columns ? (
          <>
            <div className="flex w-48 shrink-0 flex-col gap-0.5 border-r border-border py-6 pr-4">
              <p className="mb-3 text-micro uppercase tracking-widest text-muted-blue">
                {menu.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {menu.groups.map((group, index) => {
                  const rowProps = {
                    "data-nav-group": index,
                    "aria-current":
                      index === activeIndex ? ("true" as const) : undefined,
                    tabIndex: index === activeIndex ? 0 : -1,
                    onMouseEnter: () => setActiveIndex(index),
                    onFocus: () => setActiveIndex(index),
                    onKeyDown: (e: KeyboardEvent<HTMLElement>) =>
                      onGroupKeyDown(e, index),
                    className: cn(
                      "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors",
                      index === activeIndex
                        ? "bg-surface-blue font-medium text-primary"
                        : "text-body hover:bg-surface hover:text-primary",
                    ),
                  };
                  const chevron = (
                    <ChevronRight
                      className="size-3 shrink-0 text-border"
                      aria-hidden
                    />
                  );
                  return (
                    <li key={group.title}>
                      {group.href ? (
                        <NavItemLink
                          href={group.href}
                          {...rowProps}
                          onPointerDown={(
                            e: ReactPointerEvent<HTMLElement>,
                          ) => {
                            previewOnly.current =
                              e.pointerType !== "mouse" &&
                              index !== activeIndex;
                          }}
                          onClick={(e) => {
                            if (previewOnly.current) {
                              previewOnly.current = false;
                              e.preventDefault();
                              setActiveIndex(index);
                              return;
                            }
                            onNavigate();
                          }}
                        >
                          {group.title}
                          {chevron}
                        </NavItemLink>
                      ) : (
                        <button
                          type="button"
                          {...rowProps}
                          onClick={() => setActiveIndex(index)}
                        >
                          {group.title}
                          {chevron}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {footerLink ? (
                <NavItemLink
                  href={footerLink.href}
                  external={footerLink.external}
                  data-nav-footer
                  onClick={onNavigate}
                  className="mt-3 flex items-center gap-1 border-t border-border px-3 pt-3 text-sm font-medium text-primary transition-opacity hover:opacity-70"
                >
                  {footerLink.label}{" "}
                  <ArrowRight className="size-3.5" aria-hidden />
                </NavItemLink>
              ) : null}
            </div>

            <div className="flex-1 px-8 py-6">
              {menu.groups.map((group, index) => (
                <div key={group.title} hidden={index !== activeIndex} data-nav-links={index}>
                  <p
                    id={`${id}-title-${index}`}
                    className="mb-3 text-micro uppercase tracking-widest text-muted-blue"
                  >
                    {group.title}
                  </p>
                  <ul
                    aria-labelledby={`${id}-title-${index}`}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        focusGroup(index);
                      } else onLinksKeyDown(e);
                    }}
                    className="grid grid-cols-2 gap-x-8 gap-y-1"
                  >
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <NavItemLink href={link.href} external={link.external} data-nav-link onClick={onNavigate} className={linkClass}>
                          {arrow}
                          {link.label}
                        </NavItemLink>
                      </li>
                    ))}
                    {group.href ? (
                      <li className="col-span-2 mt-1">
                        <NavItemLink
                          href={group.href}
                          data-nav-link
                          onClick={onNavigate}
                          className="flex items-center gap-1 py-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-70"
                        >
                          {NAV_CONTENT.viewAll(group.title)}{" "}
                          <ArrowRight className="size-3.5" aria-hidden />
                        </NavItemLink>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {featured ? (
          <div className="flex w-56 shrink-0 flex-col border-l border-border py-6 pl-6">
            <p className="mb-3 text-micro uppercase tracking-widest text-muted-blue">
              {featured.heading ?? "Featured"}
            </p>
            <div className="flex flex-1 flex-col">
              <div className="relative mb-3 aspect-[4/3] w-full">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              </div>
              {featured.eyebrow ? (
                <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-blue">
                  {featured.eyebrow}
                </p>
              ) : null}
              <p className="mb-1 text-sm font-medium leading-snug text-primary">
                {featured.title}
              </p>
              {featured.subtitle ? (
                <p className="mb-1 text-xs text-body">{featured.subtitle}</p>
              ) : null}
              {featured.price ? (
                <p className="mb-3 text-xs text-body">
                  From{" "}
                  <span className="font-medium text-accent">
                    {featured.price}
                  </span>
                  {featured.priceUnit ? ` ${featured.priceUnit}` : null}
                </p>
              ) : null}
              <NavItemLink
                href={featured.href}
                onClick={onNavigate}
                className="mt-auto flex items-center gap-1 self-start border-b border-primary pb-px text-xs font-medium text-primary transition-opacity hover:opacity-70"
              >
                {featured.cta ?? "View offer"}{" "}
                <ArrowRight className="size-3" aria-hidden />
              </NavItemLink>
            </div>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
