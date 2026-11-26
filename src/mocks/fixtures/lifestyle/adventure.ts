import { experienceCategory } from "@/constants/routes";
import type { LifestylePageFixture } from "@/interfaces";
import { photo, proto } from "./assets";
import { article } from "./article";

export const adventure: LifestylePageFixture = {
  slug: "adventure",
  crumb: "Adventure vacations",
  seo: {
    title: "Adventure vacations",
    description: "Surf weeks, mountain expeditions and wild landscapes: adventure vacations for explorers and thrill-seekers, with small-group and guided trips worldwide.",
  },
  hero: {
    eyebrow: "Adventure vacations",
    h1: "Follow the thrill,\nsomewhere unforgettable.",
    sub: "Step beyond the familiar and into life-changing moments designed for nature lovers, explorers and thrill-seekers.",
    image: { src: proto("lifestyle/adventure/a338e.png"), alt: "Climbers celebrating together on a mountain adventure" },
    primaryCta: "Explore adventure vacations",
    secondaryCta: "Discover more",
  },
  subNav: ["Why adventure", "Find your journey", "Top packages"],
  intro: {
    eyebrow: "Beyond the everyday",
    title: "A vacation that makes you feel alive.",
    body: "A rush of wind flies through your hair and a thrill of excitement extends to the rest of your body. There's a longing for something different that takes you out of the cycle of work and relationships. Your eyes widen at the idea of trying something new—something that brings you out of your comfort zone. You are seeking adventure. Vacayou's adventure vacations take you out of your day-to-day routine and make this a vacation to remember.",
    linkLabel: "View all adventure vacations",
    // TODO(api): no adventure category page yet; this is the Multi-Adventure Trips category.
    linkHref: experienceCategory("multi-adventure-trips"),
  },
  rows: {
    eyebrow: "Answer the call",
    title: "Make room for the extraordinary.",
    items: [
      {
        eyebrow: "Be here now",
        title: "Living in The Moment",
        body: "They say the best way to live life is in the moment and not to worry about tomorrow. Adventure vacations put travelers in a particular state of mind, pushing them to live in the present. Whether it's venturing out into the unknown or doing something never imaginable, these adventure vacations are for nature lovers and thrill-seekers who enjoy the things that make life vibrant.",
        image: { src: proto("lifestyle/adventure/b9bea.png"), alt: "Adventurers watching the sun rise from a mountain summit" },
      },
      {
        eyebrow: "Shift your perspective",
        title: "Profound Experiences",
        body: "An adventure vacation is more than just a conversation-starter with co-workers. It is an experience that takes travelers out of the norms and busyness of life, challenging them to go outside of their comfort zone and see the world from a new perspective. It's a search for profound experiences meant to change the lives of travelers even years after the vacation is over.",
        image: { src: proto("lifestyle/adventure/af6c5.png"), alt: "Glacier landscape on an adventure journey" },
      },
      {
        eyebrow: "Choose the unexpected",
        title: "A Desire for Something Different",
        body: "When was the last time something new and exciting happened? Meant to help you live in the moment, adventure vacations help travelers stay grounded in the newness of life. Whether it's jumping out of a plane, soaring thousands of feet in the sky or climbing the highest mountain in the world, life is too short to say no to adventure.",
        image: { src: proto("lifestyle/adventure/95bdd.png"), alt: "Remote mountain lake surrounded by dramatic peaks" },
      },
    ],
  },
  packages: {
    eyebrow: "Made for the bold",
    title: "Adventure vacations to move you",
    sub: "From surf breaks and mountain trails to wild landscapes, find the right pace for your next great story.",
    filters: ["Surf", "Mountain", "Nature", "Active"],
    viewAllLabel: "View all adventure vacations",
    viewAllHref: experienceCategory("multi-adventure-trips"),
  },
  packageRefs: [
    { id: "nicaragua-surf-week", badge: "Featured", category: "Surf & Adventure", filters: ["Surf"], highlights: ["Daily surf coaching", "Sailing and coastal adventures", "Local culture experiences"] },
    { id: "costa-rica-volcano", badge: "New", category: "Nature & Adventure", filters: ["Nature"], highlights: ["Guided volcano hike", "White-water rafting", "Rainforest zipline"] },
    { id: "patagonia-peaks", badge: "Expedition", category: "Mountain Adventure", filters: ["Mountain"], highlights: ["Private trekking guides", "Glacier excursion", "All meals included"] },
    { id: "moab-reset", badge: "Small group", category: "Active Escape", filters: ["Active"], highlights: ["Canyon hiking", "Sunrise climbing session", "Stargazing experience"] },
  ],
  // TODO(cms): a real traveller quote, with the traveller's consent. This one comes from the prototype.
  quote: {
    eyebrow: "Traveller story",
    quote: "“The moment I stopped watching the horizon and started moving toward it, everything changed.”",
    attribution: "— Alex R., Vacayou Traveller · Nicaragua Adventure Week",
    imageSrc: photo("1788072847968-69c17d5f70ca"),
    imageAlt: "Travellers sharing a mountain sunrise",
  },
  magazine: {
    eyebrow: "Adventure journal",
    sub: "Field notes, destination guides and practical inspiration for going farther.",
    featured: article("adventure-choose", "Featured story", "How to Choose an Adventure Vacation That Fits You", "Find the right balance of challenge, comfort and discovery for the way you love to travel.", "Emma Walsh", 7, photo("1789539382341-08c27031266c")),
    items: [
      article("adventure-nicaragua", "Surf", "Nicaragua's Emerald Coast Is Calling", "Warm water, uncrowded breaks and wild Pacific landscapes make this a surfer's dream.", "Maya Thompson", 6, photo("1780065617209-f9ef45a6380a")),
      article("adventure-summit", "Mountains", "The Transformative Power of a Summit", "Why climbing toward a distant peak changes more than your point of view.", "James Patel", 8, photo("1789539355039-963e74e77e19")),
      article("adventure-packing", "Packing guide", "Pack Light, Go Far: The Adventure Edit", "The versatile essentials that earn their place in every explorer's bag.", "Sophie Green", 5, photo("1789539355082-a0def21d616b")),
    ],
  },
  destinations: {
    eyebrow: "Go beyond",
    title: "Popular Adventure Destinations",
    viewAllLabel: "All adventure destinations",
    items: [
      { name: "Costa Rica", region: "Central America", count: "90+ adventures", image: photo("1788072793590-fb14087fa79d"), destinationSlug: "costa-rica" },
      { name: "Patagonia", region: "Chile & Argentina", count: "55+ adventures", image: photo("1785675731782-f2c5498c8211"), destinationSlug: "chile" },
      { name: "Nicaragua", region: "Central America", count: "45+ adventures", image: photo("1788070638037-39894b7867b8"), destinationSlug: "americas" },
      { name: "New Zealand", region: "Oceania", count: "80+ adventures", image: photo("1788070637877-ed4d08e9f977"), destinationSlug: "new-zealand" },
      { name: "Iceland", region: "Northern Europe", count: "60+ adventures", image: photo("1788771770867-da874fbb8cfc"), destinationSlug: "iceland" },
      { name: "Nepal", region: "South Asia", count: "70+ adventures", image: photo("1789539354984-965e311ecdb2"), destinationSlug: "nepal" },
      { name: "Utah", region: "United States", count: "40+ adventures", image: photo("1788072847907-f922e6bee3ef"), destinationSlug: "usa" },
      { name: "Peru", region: "South America", count: "65+ adventures", image: photo("1789539354983-f1581d5f51b3"), destinationSlug: "peru" },
    ],
  },
};
