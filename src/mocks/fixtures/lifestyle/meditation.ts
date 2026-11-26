import { experienceCategory } from "@/constants/routes";
import type { LifestylePageFixture } from "@/interfaces";
import { photo, proto } from "./assets";
import { article } from "./article";

const VIEW_ALL = experienceCategory("meditation-retreats");

export const meditation: LifestylePageFixture = {
  slug: "meditation",
  crumb: "Meditation breaks",
  seo: {
    title: "Meditation breaks",
    description: "Guided meditation breaks and mindfulness retreats: step away from the screen, rest deeply and return with more clarity, in calm settings around the world.",
  },
  hero: {
    eyebrow: "Meditation breaks",
    h1: "Quiet the noise,\nreturn to yourself.",
    sub: "Step away from the screen, settle into the present moment and rediscover the clarity that has been there all along.",
    image: { src: proto("lifestyle/meditation/c3bad.png"), alt: "A woman meditating beside calm water" },
    primaryCta: "Explore meditation breaks",
    secondaryCta: "Discover more",
  },
  subNav: ["Why meditate", "Find your practice", "Top packages"],
  intro: {
    eyebrow: "Breathe into stillness",
    title: "A more mindful way to get away.",
    body: "Take a deep breath in, then slowly exhale. Let your mind be free of stress and worries. Meditation is an act of mindfulness and staying focused on a thought or activity. It's the act of bringing in and letting go. Learn how to take a break, get off the screen and embrace the present moment. You'll leave with a better grasp of your day-to-day and feel more rejuvenated than ever before.",
    linkLabel: "View all meditation breaks",
    linkHref: VIEW_ALL,
  },
  rows: {
    eyebrow: "Make space within",
    title: "Stillness that stays with you.",
    items: [
      {
        eyebrow: "Let go",
        title: "Transformative Experience",
        body: "Imagine being able to let go of the things that bring you the most stress. Picture living a happier, more fulfilling life with enhanced awareness of your feelings and emotions. Meditation can be a transformative act that helps you better manage everyday stress. While meditation helps in the present moment, studies show its benefits can stay with you for years to come.",
        image: { src: proto("lifestyle/meditation/6d18c.png"), alt: "A small group learning meditation outdoors" },
      },
      {
        eyebrow: "Know yourself",
        title: "Understand Yourself",
        body: "Meditation allows us to be more compassionate and understanding of ourselves and others. It is about taking it in and letting it go. By embracing a meditation break, you'll leave with a better grasp of yourself and learn the skills it takes to live a more fulfilled and focused life.",
        image: { src: proto("lifestyle/meditation/09985.png"), alt: "A quiet group meditation practice in a peaceful courtyard" },
      },
      {
        eyebrow: "Live with awareness",
        title: "Enhance Your Day",
        body: "Sleep is a vital part of rejuvenation and relaxation. Meditation helps ease tension, trigger the relaxation response and support peaceful rest. It also enhances the mind by bringing focus back to the present. Let go of distractions and take a meditation break—it can pave a new path of awareness of yourself and your surroundings.",
        image: { src: proto("lifestyle/meditation/777a3.png"), alt: "A calm meditation room surrounded by woodland" },
      },
    ],
  },
  packages: {
    eyebrow: "Mindfully selected",
    title: "Meditation breaks for every intention",
    sub: "Choose a guided journey for emotional renewal, deep rest or a more sustainable everyday practice.",
    filters: ["Mindfulness", "Solo", "Nature", "Women's wellness"],
    viewAllLabel: "View all meditation breaks",
    viewAllHref: VIEW_ALL,
  },
  packageRefs: [
    { id: "south-tyrol-glow-flow", badge: "Women's wellness", category: "Mindfulness & Renewal", filters: ["Women's wellness", "Mindfulness"], highlights: ["Guided meditation", "Menopause support workshops", "Mindful movement"] },
    { id: "joshua-tree-solo", badge: "Solo journey", category: "Solo Meditation", filters: ["Solo"], highlights: ["Private meditation sessions", "Transformation coaching", "Desert mindfulness rituals"] },
    // The spec does not say which chip the third card belongs to; "Nature" would otherwise match no card.
    { id: "pisgah-holistic", badge: "Deep reset", category: "Holistic Mindfulness", filters: ["Mindfulness", "Nature"], highlights: ["Daily mindfulness practice", "Guided fitness programme", "Nutrition workshops"] },
  ],
  // TODO(cms): a real traveller quote, with the traveller's consent. This one comes from the prototype.
  quote: {
    eyebrow: "Traveller story",
    quote: "“For the first time in years, I could hear my own thoughts—and meet them with kindness.”",
    attribution: "— Priya K., Vacayou Traveller · Mindfulness Retreat",
    imageSrc: photo("1506126613408-eca07ce68773"),
    imageAlt: "Travellers sharing a guided outdoor meditation",
  },
  magazine: {
    eyebrow: "Mindfulness journal",
    sub: "Simple practices, retreat guides and thoughtful ways to bring more presence into every day.",
    featured: article("meditation-first-retreat", "Featured story", "How to Choose Your First Meditation Retreat", "Consider teaching style, setting, silence and pace to find a retreat that feels supportive.", "Maya Thompson", 7, photo("1522075782449-e45a34f1ddfb")),
    items: [
      article("meditation-beginning-again", "Mindfulness", "The Art of Beginning Again", "Why returning to the breath can become a powerful practice in resilience.", "Emma Walsh", 6, photo("1526916027372-0c0852cef5d3")),
      article("meditation-sleep", "Sleep", "Can Meditation Transform the Way You Rest?", "Explore the connection between a settled nervous system and more restorative sleep.", "Sophie Green", 8, photo("1526779259212-939e64788e3c")),
      article("meditation-desert", "Solo travel", "Why Stillness Feels Different in the Desert", "A solo meditation escape can offer the spaciousness needed for real perspective.", "James Patel", 5, photo("1600618528240-fb9fc964b853")),
    ],
  },
  destinations: {
    eyebrow: "Seek stillness",
    title: "Popular Meditation Destinations",
    viewAllLabel: "All meditation destinations",
    items: [
      { name: "Bali", region: "Indonesia", count: "110+ meditation retreats", image: photo("1695795910772-6336b0beba36"), destinationSlug: "bali-indonesia" },
      { name: "Rishikesh", region: "India", count: "80+ meditation retreats", image: photo("1604078893234-ff3a1a5d5292"), destinationSlug: "india" },
      { name: "Joshua Tree", region: "California", count: "35+ meditation retreats", image: photo("1601763011535-37a74c49c696"), destinationSlug: "usa" },
      { name: "Thailand", region: "Southeast Asia", count: "75+ meditation retreats", image: photo("1461468611824-46457c0e11fd"), destinationSlug: "thailand" },
      { name: "Sedona", region: "Arizona", count: "45+ meditation retreats", image: photo("1574783797574-e7fc2348caf8"), destinationSlug: "usa" },
      { name: "Costa Rica", region: "Central America", count: "55+ meditation retreats", image: photo("1526724038726-3007ffb8025f"), destinationSlug: "costa-rica" },
      { name: "Bhutan", region: "South Asia", count: "25+ meditation retreats", image: photo("1541588007165-da26f41a1996"), destinationSlug: "asia" },
      { name: "Pisgah Forest", region: "North Carolina", count: "30+ meditation retreats", image: photo("1732107195798-4cb9db201131"), destinationSlug: "usa" },
    ],
  },
};
