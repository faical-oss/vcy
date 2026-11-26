import { experienceCategory } from "@/constants/routes";
import type { LifestylePageFixture } from "@/interfaces";
import { photo, proto } from "./assets";
import { article } from "./article";

const VIEW_ALL = experienceCategory("spa-and-thermal-retreats");

export const spa: LifestylePageFixture = {
  slug: "spa",
  crumb: "Spa vacations",
  seo: {
    title: "Spa vacations",
    description: "Spa getaways for deep restoration: thermal waters, holistic programmes, solo resets and all-inclusive spa resorts, with unhurried days and personal care.",
  },
  hero: {
    eyebrow: "Spa vacations",
    h1: "Restore deeply,\nin beautiful surroundings.",
    sub: "Personal care, restorative therapies and unhurried days come together in a sanctuary made for you.",
    image: { src: proto("lifestyle/spa/f118d.png"), alt: "A serene luxury spa resort and pool" },
    primaryCta: "Explore spa getaways",
    secondaryCta: "Discover more",
  },
  subNav: ["Why spa", "Find your ritual", "Top packages"],
  intro: {
    eyebrow: "Time for yourself",
    title: "A body-mind tune-up with room to breathe.",
    body: "Looking for a body-mind tune-up with a side of pampering? A spa vacation brings together personal care treatments and therapies with the promise of relaxation, rejuvenation and a renewed sense of purpose. Historically, spas were places of healing located around natural hot springs or mineral baths. Today, a spa is a sanctuary where guests enjoy the ultimate indulgence in massages, wraps and scrubs.",
    linkLabel: "View all spa getaways",
    linkHref: VIEW_ALL,
  },
  rows: {
    eyebrow: "Your wellbeing, your way",
    title: "Slow down and let care take over.",
    items: [
      {
        eyebrow: "Personal restoration",
        title: "Treat Yourself",
        body: "Everything about a spa vacation is designed for personal service and serenity. Forget about the outside world and focus on you and your body. When choosing a spa, it's important to pinpoint the intent of your wellness journey. A spa vacation includes paths from one-to-one consultations and self-guided experiences to a stress-free reset with exercise, clean eating and acupuncture.",
        image: { src: proto("lifestyle/spa/f2cb5.png"), alt: "A bright hydrotherapy room overlooking nature" },
      },
      {
        eyebrow: "Whole-person care",
        title: "Holistic Spa Experience",
        body: "A spa vacation caters to every whim of its guests. No two spas are alike, so make certain treatments and amenities match expectations. Spas offer massage, body therapies, skincare and salon services, while deeper wellness programmes can add medical support, nutritional counselling and holistic options from Zumba to Ayurveda.",
        image: { src: proto("lifestyle/spa/b2539.png"), alt: "A guest receiving a restorative spa treatment" },
      },
      {
        eyebrow: "Make it yours",
        title: "Spa Savvy",
        body: "Whether you're a newbie going on a spa break or a seasoned spa-goer, befriend the concierge. They can book appointments before arrival, plan activities and adjust the rhythm of your stay. Spas are ideal for friends, family and couples looking to reconnect. Leave behind the hustle and bustle and step into an oasis of calm.",
        image: { src: proto("lifestyle/spa/cd6cf.png"), alt: "An elegant spa lounge designed for quiet relaxation" },
      },
    ],
  },
  packages: {
    eyebrow: "Curated for restoration",
    title: "Spa getaways to renew you",
    sub: "From thermal waters and menopause retreats to private desert resets, choose the care your body is asking for.",
    filters: ["Thermal", "Luxury", "Solo", "Holistic"],
    viewAllLabel: "View all spa getaways",
    viewAllHref: VIEW_ALL,
  },
  packageRefs: [
    { id: "evia-thermal", badge: "Thermal waters", category: "Thermal Spa", filters: ["Thermal"], highlights: ["Daily thermal treatments", "Personal wellness consultation", "Mediterranean meals"] },
    { id: "south-tyrol-glow-flow", badge: "Specialist retreat", category: "Women's Wellness", filters: ["Holistic"], highlights: ["Personalised spa programme", "Hormone health workshops", "Daily movement sessions"], images: [proto("lifestyle/spa/f7843.png")] },
    { id: "joshua-tree-solo", badge: "Solo journey", category: "Solo Spa Reset", filters: ["Solo"], highlights: ["Private wellness sessions", "Restorative bodywork", "Desert rituals"], images: [proto("lifestyle/spa/deaf6.png")] },
    { id: "belize-all-inclusive", badge: "All inclusive", category: "Luxury Spa", filters: ["Luxury"], highlights: ["Daily spa treatment", "Oceanfront accommodation", "Wellness cuisine"] },
  ],
  // TODO(cms): a real traveller quote, with the traveller's consent. This one comes from the prototype.
  quote: {
    eyebrow: "Traveller story",
    quote: "“I arrived carrying months of tension and left feeling like myself again.”",
    attribution: "— Claire D., Vacayou Traveller · Greece Thermal Spa Retreat",
    imageSrc: photo("1488345979593-09db0f85545f"),
    imageAlt: "A restorative facial treatment at a spa retreat",
  },
  magazine: {
    eyebrow: "Spa journal",
    sub: "Treatment guides, restorative rituals and expert advice for your next spa escape.",
    featured: article("spa-choose", "Featured story", "How to Choose the Right Spa Vacation", "From thermal retreats to medical wellness, learn which style of spa best supports your goals.", "Emma Walsh", 7, photo("1676302144341-10563603f99a")),
    items: [
      article("spa-thermal", "Treatments", "Thermal Waters: An Ancient Ritual Reimagined", "The enduring appeal of mineral-rich bathing and where to experience it today.", "Maya Thompson", 6, photo("1730367019975-4ad8d9e14ef2")),
      article("spa-holistic", "Wellness", "What to Expect From a Holistic Spa Programme", "A closer look at how movement, nutrition and bodywork combine in a deeper reset.", "Sophie Green", 8, photo("1756632001389-4491cff999ba")),
      article("spa-first", "Spa etiquette", "Your First Spa Retreat, Made Simple", "Everything to know before arrival, from booking treatments to making time for rest.", "James Patel", 5, photo("1566520528415-5dba36001e10")),
    ],
  },
  destinations: {
    eyebrow: "Find your sanctuary",
    title: "Popular Spa Destinations",
    viewAllLabel: "All spa destinations",
    items: [
      { name: "Evia", region: "Greece", count: "45+ spa retreats", image: photo("1627373616777-9dafc05270fb"), destinationSlug: "greece" },
      { name: "South Tyrol", region: "Italy", count: "50+ spa retreats", image: photo("1631689655398-8b92be79d165"), destinationSlug: "italy" },
      { name: "Bali", region: "Indonesia", count: "120+ spa retreats", image: photo("1532691403316-d08a19730ed9"), destinationSlug: "bali-indonesia" },
      { name: "Belize", region: "Central America", count: "35+ spa retreats", image: photo("1588006590884-92426668e933"), destinationSlug: "americas" },
      { name: "Sedona", region: "United States", count: "55+ spa retreats", image: photo("1551816646-d64cca8d3ba0"), destinationSlug: "usa" },
      { name: "Budapest", region: "Hungary", count: "40+ spa retreats", image: photo("1729003702131-51807464dcec"), destinationSlug: "europe" },
      { name: "Thailand", region: "Southeast Asia", count: "90+ spa retreats", image: photo("1564605812674-375c5d1e4017"), destinationSlug: "thailand" },
      { name: "Iceland", region: "Northern Europe", count: "30+ spa retreats", image: photo("1731336478730-09d1f3bc5dee"), destinationSlug: "iceland" },
    ],
  },
};
