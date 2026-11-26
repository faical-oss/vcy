import { experienceGroup } from "@/constants/routes";
import type { LifestylePageFixture } from "@/interfaces";
import { photo, proto } from "./assets";
import { article } from "./article";

// TODO(api): there is no golf category yet; "View all" opens the Active & Adventure group.
const VIEW_ALL = experienceGroup("active-and-adventure");

export const golf: LifestylePageFixture = {
  slug: "golf",
  crumb: "Golf vacations",
  seo: {
    title: "Golf vacations",
    description: "Stay-and-play golf vacations on celebrated courses: championship fairways, golf and spa weekends and classic links journeys, with tee times taken care of.",
  },
  hero: {
    eyebrow: "Golf vacations",
    h1: "Find your rhythm,\non remarkable fairways.",
    sub: "Play celebrated courses, breathe in the open air and enjoy every detail of a seamless stay-and-play escape.",
    image: { src: photo("1768396747921-5a18367415d2"), alt: "A championship golf course winding through green woodland" },
    primaryCta: "Explore golf vacations",
    secondaryCta: "Discover more",
  },
  subNav: ["Why golf", "Find your game", "Top packages"],
  intro: {
    eyebrow: "A timeless escape",
    title: "Fresh air, friendly competition and a beautiful course.",
    // The prototype also said "More than 24 million Americans play every year": removed, there is no source for it.
    body: "Legend has it that golf dates back to the time of Julius Caesar, but the modern game originated in Scotland in the 1600s. A day on the greens offers exercise, fresh air and a fun dose of competition. Whether a weekend getaway or weeklong intensive, a golf package is a stress-free vacation for groups, couples, solo travelers and families.",
    linkLabel: "View all golf vacations",
    linkHref: VIEW_ALL,
  },
  rows: {
    eyebrow: "Play somewhere new",
    title: "Great days begin on the first tee.",
    items: [
      {
        eyebrow: "Change your course",
        title: "Full Swing",
        body: "New holes, new greens, new birdies. Playing the same course day in and day out does nothing for your game. Golf vacations provide a break from the norm and a way to spice up your swing. Many resorts offer packages for every budget—even on award-winning championship courses. Play-and-stay packages take the hassle out of booking greens and tee-off times.",
        image: { src: proto("lifestyle/golf/8b862.png"), alt: "A golfer driving from the tee on a tree-lined course" },
      },
      {
        eyebrow: "More than a round",
        title: "On and Off the Links",
        body: "Golf is a sport for all ages and all players, from beginner to advanced. It encourages exercise as golfers walk the course and carry bags, increasing heart rate and blood flow. Guests can mix and match golf and spa packages, while resorts add fitness, tennis, biking and water sports. Get ready for a tee-rific getaway.",
        image: { src: proto("lifestyle/golf/4786b.png"), alt: "A pristine resort golf course in Williamsburg" },
      },
      {
        eyebrow: "Travel together",
        title: "The Perfect Golf Getaway",
        body: "A golf vacation makes every part of the trip easier, from reserved tee times and club storage to recovery treatments and relaxed evenings at the resort. Bring your regular foursome, plan a couples escape or travel solo and meet players who share your love of the game.",
        image: { src: proto("lifestyle/golf/60fd5.png"), alt: "A scenic golf course surrounded by mature trees" },
      },
    ],
  },
  packages: {
    eyebrow: "Tee times, taken care of",
    title: "Golf vacations worth travelling for",
    sub: "Championship courses, restorative resorts and thoughtfully planned stays for every kind of player.",
    filters: ["Championship", "Golf & spa", "Couples", "Classic links"],
    viewAllLabel: "View all golf vacations",
    viewAllHref: VIEW_ALL,
  },
  packageRefs: [
    { id: "williamsburg-golf", badge: "Stay & play", category: "Championship Golf", filters: ["Championship"], highlights: ["Three reserved tee times", "Luxury resort accommodation", "Daily breakfast"] },
    { id: "virginia-golf-spa", badge: "Couples escape", category: "Golf & Spa", filters: ["Couples", "Golf & spa"], highlights: ["Two rounds of golf", "Couples spa treatment", "Three-night stay"] },
    { id: "scottish-links", badge: "Bucket list", category: "Classic Links", filters: ["Classic links"], highlights: ["Five iconic courses", "Private driver", "Daily Scottish breakfast"] },
    { id: "costa-rica-golf", badge: "Tropical golf", category: "Golf & Wellness", filters: ["Golf & spa"], highlights: ["Four rounds of golf", "Recovery spa programme", "Oceanfront accommodation"] },
  ],
  // TODO(cms): a real traveller quote, with the traveller's consent. This one comes from the prototype.
  quote: {
    eyebrow: "Traveller story",
    quote: "“Every round felt different—the courses, the company and the space to simply enjoy the game.”",
    attribution: "— Michael T., Vacayou Traveller · Williamsburg Golf Escape",
    imageSrc: photo("1786276880812-9590b8b9ac31"),
    imageAlt: "A resort golf course framed by lush woodland",
  },
  magazine: {
    eyebrow: "Golf journal",
    sub: "Course guides, stay-and-play inspiration and smart advice for travelling golfers.",
    featured: article("golf-stay-and-play", "Featured story", "How to Plan a Seamless Stay-and-Play Vacation", "From tee times to club transport, the details that make a golf getaway feel effortless.", "James Patel", 7, photo("1774905175014-5f9de3e9c2d1")),
    items: [
      article("golf-williamsburg", "Destinations", "Why Williamsburg Belongs on Your Golf List", "Historic surroundings and celebrated courses make this Virginia destination a classic.", "Emma Walsh", 6, photo("1786276880821-4006171abcf5")),
      article("golf-spa", "Golf & wellness", "The Case for Adding Spa Time to Your Golf Trip", "Recovery, mobility and relaxation can make the days between rounds even better.", "Sophie Green", 5, photo("1783530558784-dd7f8d311f1c")),
      article("golf-checklist", "Packing guide", "The Travelling Golfer's Essential Checklist", "A practical guide to clubs, clothing and the small details that save time on arrival.", "Maya Thompson", 8, photo("1771599370349-02923621ddaf")),
    ],
  },
  destinations: {
    eyebrow: "Play the world",
    title: "Popular Golf Destinations",
    viewAllLabel: "All golf destinations",
    items: [
      { name: "Williamsburg", region: "Virginia", count: "25+ golf escapes", image: photo("1783095260961-b85d8cee49ef"), destinationSlug: "usa" },
      { name: "St Andrews", region: "Scotland", count: "40+ golf escapes", image: photo("1777556597830-368613d1d26d"), destinationSlug: "uk-and-ireland" },
      { name: "Palm Springs", region: "California", count: "55+ golf escapes", image: photo("1775326391472-024dcaf677ea"), destinationSlug: "usa" },
      { name: "Algarve", region: "Portugal", count: "60+ golf escapes", image: photo("1792048060677-76e7e88d087d"), destinationSlug: "portugal" },
      { name: "Guanacaste", region: "Costa Rica", count: "30+ golf escapes", image: photo("1758551932752-a9c603e25146"), destinationSlug: "costa-rica" },
      { name: "Pinehurst", region: "North Carolina", count: "35+ golf escapes", image: photo("1771706718495-6903cb67ff26"), destinationSlug: "usa" },
      { name: "Maui", region: "Hawaii", count: "28+ golf escapes", image: photo("1768396747938-1b3c749f6d8f"), destinationSlug: "hawaii" },
      { name: "Cabo San Lucas", region: "Mexico", count: "45+ golf escapes", image: photo("1793477596921-82a8b58fd058"), destinationSlug: "mexico" },
    ],
  },
};
