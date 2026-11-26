import type { EditorialQuote, MagazineArticle } from "@/interfaces";
import { local, unsplash } from "./assets";
import { EXTERNAL_URLS } from "@/constants/routes";

export const editorial: EditorialQuote = {
  eyebrow: "From the Vacayou Magazine",
  quote: '"The most transformative trip I\'ve ever taken — and it changed everything."',
  attribution: "— Sarah M., Vacayou Traveller · Bali Yoga Retreat 2024",
  ctaLabel: "Read her story",
  href: EXTERNAL_URLS.magazine,
  external: true,
  imageSrc: unsplash("1602192446604-8ba7ee80d252"),
};

export const articles: MagazineArticle[] = [
    {
      id: "digital-detox",
      category: "Featured story",
      title: "10 Signs You're Ready for a Digital Detox Retreat",
      excerpt: "The constant pull of screens is real. Here's how to know when it's time to step back — and where to go.",
      author: "Emma Walsh",
      readTimeMinutes: 5,
      href: EXTERNAL_URLS.magazine,
      external: true,
      imageSrc: local("mag-digital-detox.jpg"),
    },
    {
      id: "rishikesh",
      category: "Destinations",
      title: "Why Rishikesh Is the World Capital of Yoga",
      excerpt: "Nestled in the Himalayan foothills, this ancient city has attracted spiritual seekers for centuries.",
      author: "James Patel",
      readTimeMinutes: 8,
      href: EXTERNAL_URLS.magazine,
      external: true,
      imageSrc: local("mag-rishikesh.png"),
    },
    {
      id: "cycling-france",
      category: "Active Travel",
      title: "The Ultimate Guide to Multi-Stage Cycling in France",
      excerpt: "From the Loire Valley to the Pyrenees — our expert guide to planning the perfect cycling trip.",
      author: "Sophie Laurent",
      readTimeMinutes: 12,
      href: EXTERNAL_URLS.magazine,
      external: true,
      imageSrc: local("mag-cycling-france.png"),
    },
    {
      id: "ayurveda",
      category: "Retreats",
      title: "Ayurveda vs. Western Wellness: What's the Difference?",
      excerpt: "Understanding the ancient Indian system of medicine — and how it can complement your modern life.",
      author: "Dr. Priya Singh",
      readTimeMinutes: 6,
      href: EXTERNAL_URLS.magazine,
      external: true,
      imageSrc: unsplash("1546483875-ad9014c88eba"),
    },
];
