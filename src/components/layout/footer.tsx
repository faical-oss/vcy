import Image from "next/image";
import Link from "next/link";
import { Rss } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, PinterestIcon, XIcon } from "@/components/icons/social";
import { Container } from "@/components/ui/container";
import { NavItemLink } from "./nav-item-link";
import { FOOTER_COLUMNS, LEGAL_LINKS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { TRUST_LOGOS } from "@/constants/trust-logos";
import { SITE_COPYRIGHT, SITE_FOOTER_BLURB } from "@/constants/site";

// TODO: real profile URLs once confirmed by the client.
const SOCIALS = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "X", href: "#", Icon: XIcon },
  { label: "Pinterest", href: "#", Icon: PinterestIcon },
  { label: "RSS feed", href: "#", Icon: Rss },
] as const;

export function Footer() {
  return (
    <footer data-site-footer className="bg-primary text-primary-foreground">
      <Container className="py-10 sm:py-14">
        <div className="mb-12 grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div>
            <Link href={ROUTES.home} aria-label="Vacayou home" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-4 max-w-[278px] text-[13px] leading-[1.45] text-white/85">{SITE_FOOTER_BLURB}</p>
            <p className="mt-6 font-display text-[27px] font-medium">Follow us</p>
            <ul className="mt-3 flex items-center gap-5 pointer-coarse:-ml-3.5 pointer-coarse:gap-0">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} aria-label={label} className="text-white/90 transition-opacity hover:opacity-60 pointer-coarse:flex pointer-coarse:size-11 pointer-coarse:items-center pointer-coarse:justify-center">
                    <Icon className="h-[15px] w-auto" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-display text-[27px] font-medium leading-tight tracking-[-0.405px]">{column.title}</h2>
              <ul className="mt-5 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <NavItemLink href={link.href} external={link.external} className="text-[13px] text-white/90 transition-colors hover:text-white">
                      {link.label}
                    </NavItemLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Infinite right-to-left marquee; pauses on hover/focus and for reduced motion. */}
        <div className="group mb-8 overflow-hidden border-t border-white/30 pt-8">
          <ul className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...TRUST_LOGOS, ...TRUST_LOGOS].map((logo, i) => (
              <li key={i} aria-hidden={i >= TRUST_LOGOS.length} className="shrink-0 px-6">
                <Image src={logo.src} alt="Trust accreditation" width={logo.width * 2} height={logo.height * 2} style={{ height: logo.height, width: "auto" }} className="object-contain opacity-90 mix-blend-luminosity" />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-divider-dark pt-6 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-white/75">{SITE_COPYRIGHT}</p>
          <ul className="flex gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[13px] text-white transition-opacity hover:opacity-60">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
