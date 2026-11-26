import { experienceCategory } from "@/constants/routes";
import type { LifestylePageFixture } from "@/interfaces";
import { photo, proto } from "./assets";
import { article } from "./article";

const VIEW_ALL = experienceCategory("yoga-retreats");

/** The yoga cards show a four-photo carousel: the card's own first photo, then three shared ones. */
const BEACH = [photo("1506126613408-eca07ce68773"), photo("1602192509154-0b900ee1f851"), photo("1600618528240-fb9fc964b853")];
const SPA = [photo("1571003123894-1f0594d2b5d9"), photo("1520250497591-112f2f40a3f4"), photo("1582719508461-905c673771fd")];

export const yoga: LifestylePageFixture = {
  slug: "yoga",
  crumb: "Yoga retreats",
  seo: {
    title: "Yoga retreats",
    description: "Yoga retreats for every practice: solo desert resets, yoga and surf escapes, mindfulness weeks and luxury wellness stays in beautiful places around the world.",
  },
  hero: {
    eyebrow: "Yoga retreats",
    h1: "Find your flow,\nsomewhere extraordinary.",
    sub: "Leave the everyday behind and step into a sanctuary of self-discovery, movement and meaningful connection.",
    image: { src: proto("yoga/yoga-retreats-hero.png"), alt: "A group practising yoga together on a tropical beach" },
    primaryCta: "Explore yoga retreats",
    secondaryCta: "Discover more",
  },
  subNav: ["Why yoga", "Find your retreat", "Top packages"],
  intro: {
    eyebrow: "More than a practice",
    title: "A chance to reconnect with what matters.",
    body: "There is something powerful about slowing down, breathing fresh air, and connecting with Earth. A yoga retreat is a chance to leave behind the hustle and bustle of everyday life and step into a magical sanctuary of self-discovery. From day one, guests set an intention to make well-being a priority. But there's more than meets the eye. A yoga retreat offers a sweet balance of the practice, indulgence and play—not to mention life-long transformation.",
    linkLabel: "View all yoga retreats",
    linkHref: VIEW_ALL,
  },
  rows: {
    eyebrow: "Your retreat, your rhythm",
    title: "Space to move, pause and begin again.",
    items: [
      {
        eyebrow: "Make it yours",
        title: "Crafting your experience",
        body: "Choosing a yoga retreat doesn't have to be a daunting experience. Whatever the preference, there's a yoga getaway ranging from charming and peaceful to exotic and adventurous. The beauty of a yoga retreat lies in the fact that it's not a one-size-fits-all package. Newbie? No problem. Experienced practitioner? Flow this way. While yoga is obviously the big pull, it isn't the only program on the agenda. Yogis can delve into carefully curated activities such as Ayurveda, culinary training, whale watching and hiking, just to name a few. Time-wise, retreats run on average from a weekend immersion up to 10 days.",
        image: { src: proto("yoga/crafting-your-experience.png"), alt: "A light-filled yoga studio prepared for a retreat" },
      },
      {
        eyebrow: "Time to restore",
        title: "Pressing the pause button",
        body: "A yoga retreat is all about rebalancing the body, mind and soul. Not every retreat offers a digital detox, but every retreat does offer the opportunity to steal precious moments for yourself. Learn what it means to embrace downtime with some serious spa indulgence designed to cure your wellness wanderlust. Whether it's a pampering massage or a blessing ceremony, there's a treatment for everyone. Expand your mind, find balance through meditation or just be and experience what yoga means on and off the mat.",
        image: { src: proto("yoga/pressing-pause.png"), alt: "A calming spa treatment during a yoga retreat" },
      },
      {
        eyebrow: "Return renewed",
        title: "Benefits beyond the mat",
        body: "Asana practice aside, a yoga retreat is a chance to take a time-out and explore a beautiful destination. All of our retreats are set in breathtaking surroundings with nature as the backdrop. Research reveals that connecting with nature has a rejuvenating effect on wellness. A yoga retreat brings together like-minded souls from different walks of life. The memories, friendship, and sense of community gained last a lifetime. To get the most out of a retreat, however, pack destination-specific attire, reading material, a journal and an open mind. See you on the mat!",
        image: { src: proto("yoga/benefits-beyond-mat.png"), alt: "Yoga practice surrounded by tropical nature" },
      },
    ],
  },
  packages: {
    eyebrow: "Curated for your practice",
    title: "Yoga retreats to inspire you",
    sub: "From solo desert resets to tropical yoga and surf escapes, find a journey that meets you exactly where you are.",
    filters: ["Solo", "Beach & surf", "Mindfulness", "Luxury"],
    viewAllLabel: "View all yoga retreats",
    viewAllHref: VIEW_ALL,
  },
  packageRefs: [
    { id: "joshua-tree-solo", badge: "Solo journey", category: "Yoga & Transformation", filters: ["Solo"], highlights: ["Private yoga and meditation", "Personal transformation sessions", "Desert wellness rituals"], images: [proto("yoga/joshua-tree-retreat.png"), ...BEACH] },
    { id: "yoga-surf-nicaragua", badge: "Beach escape", category: "Yoga & Surf", filters: ["Beach & surf"], highlights: ["Daily yoga practice", "Guided surf sessions", "Spa treatments"], images: [proto("yoga/yoga-surf-retreat.png"), ...BEACH] },
    { id: "pisgah-holistic", badge: "Deep reset", category: "Holistic Yoga", filters: ["Mindfulness"], highlights: ["Daily mindfulness practice", "Guided fitness programme", "Nutrition workshops"], images: [proto("yoga/holistic-wellness-retreat.png"), ...BEACH] },
    { id: "bali-soul-surf", badge: "Best Seller", category: "Surf & Wellness", filters: ["Beach & surf"], highlights: ["7 nights accommodation", "Daily yoga & surf sessions", "Organic plant-based meals"], images: [photo("1537996194471-e657df975ab4"), ...SPA] },
    { id: "tuscany-wellness", badge: "Editor's Pick", category: "Wellness & Culture", filters: ["Mindfulness"], highlights: ["5 nights boutique villa stay", "Daily meditation & yoga", "Organic farm dining"], images: [photo("1523531294919-4bcd7c65e216"), ...SPA] },
    { id: "maldives-escape", badge: "Luxury", category: "Luxury Wellness", filters: ["Luxury"], highlights: ["6 nights overwater villa", "Personalised wellness programme", "Full board organic dining"], images: [photo("1512343879784-a960bf40e7f2"), ...SPA] },
  ],
  // TODO(cms): a real traveller quote, with the traveller's consent. This one comes from the prototype.
  quote: {
    eyebrow: "Traveller story",
    quote: "“The most transformative trip I've ever taken—and it changed everything.”",
    attribution: "— Sarah M., Vacayou Traveller · Bali Yoga Retreat",
    imageSrc: photo("1683056255281-e52a141924f0"),
    imageAlt: "Yoga retreat travellers practising together on the beach",
  },
  magazine: {
    eyebrow: "Yoga journal",
    sub: "Yoga stories, expert guides and inspiration for your practice.",
    featured: article("yoga-choose", "Featured story", "How to Choose the Right Yoga Retreat for You", "From practice style and pace to destination and group size, discover how to find a retreat that feels made for you.", "Emma Walsh", 7, photo("1544367567-0f2fcb009e0b")),
    items: [
      article("yoga-rishikesh", "Destinations", "Why Rishikesh Is the World Capital of Yoga", "Nestled in the Himalayan foothills, this ancient city has attracted spiritual seekers for centuries.", "James Patel", 8, photo("1588286840104-8957b019727f")),
      article("yoga-styles", "Yoga guide", "Yoga Styles Explained: Finding Your Flow", "Vinyasa, Hatha, Yin or Ashtanga? A simple guide to choosing the practice that suits your energy and intention.", "Maya Thompson", 6, photo("1545205597-3d9d02c29597")),
      article("yoga-first-retreat", "First retreat", "From First Class to Final Savasana: What to Expect", "Everything you need to know before your first yoga retreat, from what to pack to making space for stillness.", "Sophie Green", 5, photo("1545389336-cf090694435e")),
    ],
  },
  destinations: {
    eyebrow: "Find your flow",
    title: "Popular Yoga Destinations",
    viewAllLabel: "All yoga destinations",
    items: [
      { name: "Bali", region: "Indonesia", count: "120+ yoga retreats", image: photo("1524863479829-916d8e77f114"), destinationSlug: "bali-indonesia" },
      { name: "Rishikesh", region: "India", count: "85+ yoga retreats", image: photo("1608405059861-b21a68ae76a2"), destinationSlug: "india" },
      { name: "Costa Rica", region: "Central America", count: "70+ yoga retreats", image: photo("1767452985095-5e4fbae2f1c9"), destinationSlug: "costa-rica" },
      { name: "Koh Samui", region: "Thailand", count: "65+ yoga retreats", image: photo("1794150105372-c23da5b45fa7"), destinationSlug: "thailand" },
      { name: "Sri Lanka", region: "South Asia", count: "55+ yoga retreats", image: photo("1761520390583-f9084b37bba7"), destinationSlug: "sri-lanka" },
      { name: "Greece", region: "Europe", count: "45+ yoga retreats", image: photo("1570077188670-e3a8d69ac5ff"), destinationSlug: "greece" },
      { name: "Portugal", region: "Europe", count: "40+ yoga retreats", image: photo("1555881400-74d7acaacd8b"), destinationSlug: "portugal" },
      { name: "Morocco", region: "North Africa", count: "35+ yoga retreats", image: photo("1539020140153-e479b8c22e70"), destinationSlug: "morocco" },
    ],
  },
};
