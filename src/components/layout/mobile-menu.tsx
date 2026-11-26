"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronRight, CircleHelp, Heart, Menu, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Logo } from "@/components/brand/logo";
import { IconButton } from "@/components/ui/icon-button";
import { NAV_CONTENT } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/helpers/cn";
import type { NavLink, NavMenu, NavMenuId } from "@/interfaces";
import { NavItemLink } from "./nav-item-link";
import { SAFE_AREA_PADDING } from "@/constants/safe-area";

interface MobileMenuProps {
  menus: readonly NavMenu[];
  supportHref: string;
  favoritesHref: string;
  accountHref: string;
}

/** Tailwind `lg` (64rem): the full-width nav replaces this menu from here up. */
const DESKTOP_QUERY = "(min-width: 64rem)";

const LINK_ROW = "flex w-full items-center gap-1.5 py-2.5 text-left text-sm text-body hover:text-primary";

/** The account button of the menu header, in the closed and the open menu: a 44px round button, the same size as the menu / close button next to it. */
const HEADER_ACCOUNT = "flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent-hover";

/**
 * Full-screen menu below `lg`, driven by `menus`. A Radix Dialog: traps focus, hides the page behind, locks body scroll and closes on Escape, link click, route change and when the viewport reaches `lg`.
 * Accordion: menu (links to its page when it has one) -> group -> links. A menu with a single group (Lifestyle) lists its links directly.
 */
export function MobileMenu({ menus, supportHref, favoritesHref, accountHref }: MobileMenuProps) {
  const { session, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<NavMenuId | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => event.matches && setOpen(false);
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, []);

  const close = () => setOpen(false);
  const toggleItem = (id: NavMenuId) => {
    setOpenItem((current) => (current === id ? null : id));
    setOpenCategory(null);
  };
  const toggleCategory = (key: string) => setOpenCategory((current) => (current === key ? null : key));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="lg:hidden">
        <div className="flex items-center gap-1">
          {session ? (
            <Link
              href={accountHref}
              aria-label="Open account"
              className={HEADER_ACCOUNT}
            >
              <User className="size-4" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              aria-label="Open account"
              onClick={(event) => openAuth("login", event.currentTarget)}
              className={HEADER_ACCOUNT}
            >
              <User className="size-4" aria-hidden />
            </button>
          )}
          <Dialog.Trigger asChild>
            <IconButton
              aria-label={open ? "Close menu" : "Open menu"}
              aria-controls={undefined}
              className="-mr-1 size-11 shrink-0 border-transparent text-body"
            >
              <Menu className="size-5" />
            </IconButton>
          </Dialog.Trigger>
        </div>

        <Dialog.Portal>
          {/* Radix applies the body scroll lock through the Overlay; the opaque Content covers it. */}
          <Dialog.Overlay className="fixed inset-0 z-[60] lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              closeRef.current?.focus();
            }}
            className={`fixed inset-0 z-[60] flex flex-col bg-card focus:outline-none lg:hidden ${SAFE_AREA_PADDING}`}
          >
            <Dialog.Title className="sr-only">Main menu</Dialog.Title>
            <div className="shrink-0 border-b border-border bg-card shadow-header">
              <div className="mx-auto flex h-header w-full max-w-site items-center justify-between px-6">
                <Link href={ROUTES.home} onClick={close} aria-label="Vacayou home" className="text-primary transition-opacity hover:opacity-75">
                  <Logo />
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  {session ? (
                    <Link
                      href={accountHref}
                      onClick={close}
                      aria-label="Open account"
                      className={HEADER_ACCOUNT}
                    >
                      <User className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      aria-label="Open account"
                      onClick={(event) => {
                        close();
                        openAuth("login", event.currentTarget);
                      }}
                      className={HEADER_ACCOUNT}
                    >
                      <User className="size-4" aria-hidden />
                    </button>
                  )}
                  <Dialog.Close asChild>
                    <IconButton ref={closeRef} aria-label="Close menu" className="-mr-1 size-11 shrink-0 border-transparent text-body">
                      <X className="size-5" />
                    </IconButton>
                  </Dialog.Close>
                </div>
              </div>
            </div>

            <nav aria-label="Main" className="flex-1 overflow-y-auto">
              {menus.map((menu) => {
                const { id, label, groups, featured, footerLink } = menu;
                const itemOpen = openItem === id;
                const itemPanelId = `mobile-nav-${id}`;
                return (
                  <div key={id} className="border-b border-border">
                    <AccordionRow
                      label={label}
                      expanded={itemOpen}
                      controls={itemPanelId}
                      onToggle={() => toggleItem(id)}
                      onNavigate={close}
                      labelClassName="px-6 py-4 text-base font-semibold tracking-wide text-primary"
                    />
                    {itemOpen ? (
                      <div id={itemPanelId} role="group" aria-label={label} className="bg-surface">
                        {groups.length === 1 ? (
                          <LinkList links={groups[0].links} label={groups[0].title} onNavigate={close} />
                        ) : (
                          groups.map((group, index) => {
                            const key = `${id}:${group.title}`;
                            const groupPanelId = `${itemPanelId}-group-${index}`;
                            const categoryOpen = openCategory === key;
                            return (
                              <div key={key} className="border-b border-border last:border-b-0">
                                <AccordionRow
                                  label={group.title}
                                  expanded={categoryOpen}
                                  controls={groupPanelId}
                                  onToggle={() => toggleCategory(key)}
                                  labelClassName="px-8 py-3.5 text-sm font-medium text-body"
                                />
                                {categoryOpen ? (
                                  <LinkList
                                    id={groupPanelId}
                                    links={group.links}
                                    label={group.title}
                                    viewAll={group.href ? { label: NAV_CONTENT.viewAll(group.title), href: group.href } : undefined}
                                    onNavigate={close}
                                  />
                                ) : null}
                              </div>
                            );
                          })
                        )}
                        {footerLink ? (
                          <NavItemLink
                            href={footerLink.href}
                            external={footerLink.external}
                            onClick={close}
                            className="flex min-h-[44px] items-center gap-1 border-t border-border px-8 text-sm font-medium text-primary"
                          >
                            {footerLink.label} <ArrowRight className="size-3.5" aria-hidden />
                          </NavItemLink>
                        ) : null}
                        {featured ? (
                          <NavItemLink href={featured.href} onClick={close} className="flex items-center gap-4 border-t border-border px-8 py-4">
                            <span className="relative aspect-[4/3] w-24 shrink-0">
                              <Image src={featured.image} alt="" fill sizes="96px" className="object-cover" />
                            </span>
                            <span className="flex flex-col gap-1">
                              {featured.eyebrow ? <span className="text-[11px] uppercase tracking-widest text-muted-blue">{featured.eyebrow}</span> : null}
                              <span className="text-sm font-medium leading-snug text-primary">{featured.title}</span>
                              {featured.subtitle ? <span className="text-xs text-body">{featured.subtitle}</span> : null}
                              {featured.price ? (
                                <span className="text-xs text-body">
                                  From <span className="font-medium text-accent">{featured.price}</span>
                                  {featured.priceUnit ? ` ${featured.priceUnit}` : null}
                                </span>
                              ) : null}
                            </span>
                          </NavItemLink>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            {/* Support and Favorites sit at the bottom of the menu (mobile design). */}
            <div className="shrink-0 border-t border-border bg-card">
              <div className="mx-auto flex h-12 w-full max-w-site items-center gap-6 px-6">
                <Link href={supportHref} onClick={close} className="flex min-h-[44px] items-center gap-1.5 text-sm text-body">
                  <CircleHelp className="size-4 text-muted-blue" aria-hidden /> Support
                </Link>
                {session ? (
                  <Link href={favoritesHref} onClick={close} className="flex min-h-[44px] items-center gap-1.5 text-sm text-body">
                    <Heart className="size-4 text-muted-blue" aria-hidden /> Favorites
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      close();
                      openAuth("login", event.currentTarget);
                    }}
                    className="flex min-h-[44px] items-center gap-1.5 text-sm text-body"
                  >
                    <Heart className="size-4 text-muted-blue" aria-hidden /> Favorites
                  </button>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </div>
    </Dialog.Root>
  );
}

function LinkList({
  id,
  links,
  label,
  viewAll,
  onNavigate,
}: {
  id?: string;
  links: readonly NavLink[];
  label: string;
  /** Link to the page of the group itself, listed after its links. */
  viewAll?: { label: string; href: string };
  onNavigate: () => void;
}) {
  return (
    <ul id={id} aria-label={label} className="border-t border-border bg-surface px-10 py-2">
      {links.map((link) => (
        <li key={link.href}>
          <NavItemLink href={link.href} external={link.external} onClick={onNavigate} className={LINK_ROW}>
            <ChevronRight className="size-[11px] shrink-0 text-muted-blue" aria-hidden />
            {link.label}
          </NavItemLink>
        </li>
      ))}
      {viewAll ? (
        <li>
          <NavItemLink href={viewAll.href} onClick={onNavigate} className={cn(LINK_ROW, "font-medium text-primary")}>
            {viewAll.label} <ArrowRight className="size-3.5" aria-hidden />
          </NavItemLink>
        </li>
      ) : null}
    </ul>
  );
}

/** Row with a label and a chevron. With `href` the label is a link and the chevron button is the (labelled) toggle. */
function AccordionRow({
  label,
  href,
  expanded,
  controls,
  onToggle,
  onNavigate,
  labelClassName,
}: {
  label: string;
  href?: string;
  expanded: boolean;
  controls: string;
  onToggle: () => void;
  onNavigate?: () => void;
  labelClassName: string;
}) {
  const chevron = <ChevronDown className={cn("size-4 transition-transform duration-150", expanded && "rotate-180")} aria-hidden />;
  const ariaControls = expanded ? controls : undefined;

  if (href) {
    return (
      <div className="flex items-stretch">
        <NavItemLink href={href} onClick={onNavigate} className={cn("flex flex-1 items-center text-left", labelClassName)}>
          {label}
        </NavItemLink>
        <button
          type="button"
          aria-label={`${label} sections`}
          aria-expanded={expanded}
          aria-controls={ariaControls}
          onClick={onToggle}
          className="min-w-11 px-5 text-muted-blue"
        >
          {chevron}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-stretch">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={ariaControls}
        onClick={onToggle}
        className={cn("flex flex-1 items-center text-left", labelClassName)}
      >
        {label}
      </button>
      <button type="button" tabIndex={-1} aria-hidden onClick={onToggle} className="px-5 text-muted-blue">
        {chevron}
      </button>
    </div>
  );
}
