import { slugify } from "@/helpers/slugify";
import type { SearchBoxContent, SearchOption } from "@/interfaces";

const option = (label: string): SearchOption => ({ label, slug: slugify(label) });
const options = (labels: string[]) => labels.map(option);

/**
 * The lists of the search box, as in the Figma prototype. The slugs are `slugify(label)`: a destination or type that has no
 * page of its own yet still searches by that slug. TODO(api): types and destinations come from the catalog.
 */
export const searchBoxFixture: SearchBoxContent = {
  tabs: [
    {
      tab: "experience",
      label: "Experiences",
      typeLabel: "Experience type",
      typePlaceholder: "Any experience",
      typeLayout: "pills",
      types: options(["Yoga Retreats", "Wellness & Spa", "Meditation", "Hiking & Trekking", "Cycling", "Surf & Water Sports", "Fitness & Bootcamp", "Culinary & Wine", "Cultural Immersion", "Ayurveda", "Pilates", "Adventure", "Wellness Retreat", "Cycling Tours", "Detox Retreat", "Spiritual Retreat", "Surf & Yoga", "Fitness Camp"]),
      destinationPlaceholder: "Anywhere",
      datesLabel: "Dates",
      guestsLabel: "Travellers",
      popular: [
        { field: "type", option: option("Yoga Retreats") },
        { field: "destination", option: option("Bali") },
        { field: "type", option: option("Safari") },
        { field: "type", option: option("Cycling Tours") },
        { field: "destination", option: option("Maldives") },
        { field: "type", option: option("Meditation") },
      ],
    },
    {
      tab: "package",
      label: "Packages",
      typeLabel: "Package type",
      typePlaceholder: "Any package",
      typeLayout: "pills",
      types: options(["Luxury", "Adventure", "Wellness & Detox", "Family", "Solo Retreat", "Eco & Sustainable", "Cultural", "Golf Packages", "Spa Packages", "Anniversary", "Girls' Getaway"]),
      destinationPlaceholder: "Anywhere",
      datesLabel: "Dates",
      guestsLabel: "Travellers",
      popular: [
        { field: "type", option: option("Wellness") },
        { field: "type", option: option("Adventure") },
        { field: "destination", option: option("Bali") },
        { field: "destination", option: option("Tuscany") },
        { field: "type", option: option("Luxury") },
        { field: "destination", option: option("Maldives") },
      ],
    },
    {
      tab: "hotel",
      label: "Hotels",
      typeLabel: "Hotel type",
      typePlaceholder: "Any type",
      typeLayout: "tiles",
      types: options(["Luxury Resort", "Boutique Hotel", "Self-Catering Villa", "Eco Lodge", "City Centre Hotel", "Beach Resort", "Mountain Lodge", "Safari Lodge", "Overwater Villa", "Adults Only"]),
      destinationPlaceholder: "City or hotel",
      datesLabel: "Check-in and check-out",
      guestsLabel: "Rooms and guests",
      popular: [
        { field: "destination", option: option("Bali") },
        { field: "destination", option: option("Maldives") },
        { field: "destination", option: option("Thailand") },
        { field: "destination", option: option("Italy") },
        { field: "type", option: option("Wellness Resort") },
        { field: "type", option: option("Boutique Retreat") },
      ],
    },
  ],
  destinationGroups: [
    { title: "Popular", column: 1, options: options(["Bali, Indonesia", "Tuscany, Italy", "Kerala, India", "Koh Samui, Thailand"]) },
    { title: "Europe", column: 1, options: options(["Provence, France", "Andalusia, Spain", "Amalfi, Italy", "Santorini, Greece"]) },
    { title: "Asia", column: 2, options: options(["Ubud, Bali", "Chiang Mai, Thailand", "Kyoto, Japan", "Nepal", "Sri Lanka"]) },
    { title: "Further afield", column: 2, options: options(["Maldives", "Costa Rica", "Morocco", "Zanzibar"]) },
  ],
};
