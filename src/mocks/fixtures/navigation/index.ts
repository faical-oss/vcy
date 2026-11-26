import { EXTERNAL_URLS, ROUTES, destination, destinationRegion, experienceCategory, experienceDetail, experienceGroup, hotelCategory, hotelDetail, hotelGroup, lifestyleVacation } from "@/constants/routes";
import { slugify } from "@/helpers/slugify";
import type { NavGroup, NavLink, NavMenu } from "@/interfaces";
import { unsplash } from "../home/assets";
import { EXPERIENCE_GROUPS, HOTEL_GROUPS, type LabelGroup } from "../catalog/categories";

/** `groupHref` gives a group its own page; without it the group has no href. */
function groups(source: readonly LabelGroup[], hrefFor: (slug: string) => string, groupHref?: (title: string) => string): NavGroup[] {
  return source.map((group) => ({
    title: group.title,
    ...(groupHref ? { href: groupHref(group.title) } : {}),
    links: group.labels.map((label) => ({ label, href: hrefFor(slugify(label)) })),
  }));
}

/** Destination menu, as listed in the header. Maldives, Sri Lanka and Zanzibar appear twice and share one destination slug. */
const DESTINATION_GROUPS: readonly LabelGroup[] = [
  { title: "Asia", labels: ["Bali, Indonesia", "Thailand", "India", "Nepal", "Sri Lanka", "Vietnam", "Japan", "Cambodia", "Maldives", "Malaysia", "Philippines"] },
  { title: "Europe", labels: ["Italy", "Spain", "Greece", "Portugal", "France", "Croatia", "Turkey", "Switzerland", "Austria", "UK & Ireland", "Iceland"] },
  { title: "Americas", labels: ["Costa Rica", "Mexico", "Peru", "Colombia", "Brazil", "Ecuador", "Guatemala", "USA", "Canada", "Argentina", "Chile"] },
  { title: "Africa & Middle East", labels: ["Kenya", "Tanzania", "South Africa", "Morocco", "Egypt", "Jordan", "Dubai", "Oman", "Zanzibar", "Rwanda"] },
  { title: "Oceania & Pacific", labels: ["Australia", "New Zealand", "Fiji", "French Polynesia", "Vanuatu", "Hawaii", "Cook Islands"] },
  { title: "Indian Ocean", labels: ["Maldives", "Sri Lanka", "Seychelles", "Mauritius", "Réunion", "Zanzibar", "Madagascar"] },
];

const LIFESTYLE_LINKS: NavLink[] = [
  { label: "Magazine", href: EXTERNAL_URLS.magazine, external: true },
  { label: "Glossary", href: EXTERNAL_URLS.glossary, external: true },
];

const LIFESTYLE_VACATIONS: NavLink[] = [
  { label: "Adventure", href: lifestyleVacation("adventure") },
  { label: "Golf", href: lifestyleVacation("golf") },
  { label: "Meditation", href: lifestyleVacation("meditation") },
  { label: "Spa", href: lifestyleVacation("spa") },
  { label: "Yoga", href: lifestyleVacation("yoga") },
];

// TODO: featured images come from the Figma prototype; swap for Asset Zen URLs.
export const navigationFixture: NavMenu[] = [
  {
    id: "experiences",
    label: "Experiences",
    groups: groups(EXPERIENCE_GROUPS, experienceCategory, (title) => experienceGroup(slugify(title))),
    featured: {
      eyebrow: "Editor's Pick",
      title: "8-Day Mediterranean Wellness Retreat",
      price: "$2,490",
      priceUnit: "per person",
      image: unsplash("1545389336-cf090694435e"),
      href: experienceDetail("mediterranean-wellness-retreat"),
    },
    footerLink: { label: "View all experiences", href: ROUTES.browseExperiences },
  },
  {
    id: "destinations",
    label: "Destinations",
    href: ROUTES.destinations,
    groups: groups(DESTINATION_GROUPS, (slug) => destination(slug), (title) => destinationRegion(slugify(title))),
    featured: {
      eyebrow: "Top Destination",
      title: "Bali: Wellness & Discovery Package",
      price: "$1,895",
      priceUnit: "per person",
      image: unsplash("1537953773345-d172ccf13cf1"),
      href: destination(slugify("Bali, Indonesia")),
    },
    footerLink: { label: "View all destinations", href: ROUTES.destinations },
  },
  {
    id: "hotels",
    label: "Hotels",
    groups: groups(HOTEL_GROUPS, hotelCategory, (title) => hotelGroup(slugify(title))),
    featured: {
      eyebrow: "Special Offer",
      title: "Azure Spa & Wellness Resort",
      price: "$385",
      priceUnit: "per night",
      image: unsplash("1566073771259-6a8506099945"),
      href: hotelDetail("azure-spa-and-wellness-resort-krabi"),
    },
    footerLink: { label: "View all hotels", href: ROUTES.browseHotels },
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    layout: "columns",
    groups: [
      { title: "Lifestyle", links: LIFESTYLE_LINKS },
      { title: "Lifestyle Vacations", links: LIFESTYLE_VACATIONS },
    ],
    featured: {
      heading: "Featured Package",
      eyebrow: "Wellness Escape",
      title: "7-Day Bali Yoga & Spa Escape",
      price: "$1,895",
      priceUnit: "per person",
      image: unsplash("1540202404-a2f29016b523"),
      href: experienceDetail("ubud-yoga-and-detox-retreat"),
      cta: "View package",
    },
  },
];
