import type { SearchResultsContent } from "@/interfaces";

/** Copy of the results page. The filter groups of each tab follow the Figma prototype (Hotels, Packages and Experiences). */
export const searchResultsFixture: SearchResultsContent = {
  title: "Search results",
  intro: "Browse our curated selection of exceptional places to stay",
  headings: {
    hotel: { title: "Hotels", intro: "Browse our curated selection of exceptional places to stay" },
    package: { title: "Packages", intro: "Hand-picked packages for every travel style" },
    experience: { title: "Experiences", intro: "Discover unique experiences, personally vetted by our team" },
  },
  sorts: [
    { value: "recommended", label: "Recommended" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "top-rated", label: "Top Rated" },
    { value: "stars", label: "Star Rating" },
  ],
  priceTitle: "Price Range",
  groups: {
    hotel: [
      { key: "types", title: "Hotel Type" },
      { key: "places", title: "Destination" },
      { key: "amenities", title: "Amenities" },
      { key: "board", title: "Board Type" },
      { key: "rating", title: "Rating" },
    ],
    experience: [
      { key: "types", title: "Experience Type" },
      { key: "duration", title: "Duration" },
      { key: "places", title: "Destination" },
      { key: "groupSize", title: "Group Size" },
      { key: "difficulty", title: "Difficulty" },
      { key: "amenities", title: "Included" },
      { key: "rating", title: "Rating" },
    ],
    package: [
      { key: "types", title: "Package Type" },
      { key: "duration", title: "Duration" },
      { key: "places", title: "Destination" },
      { key: "amenities", title: "Inclusions" },
      { key: "board", title: "Travel Style" },
      { key: "rating", title: "Rating" },
    ],
  },
  ratings: [
    { value: 5, label: "5 stars only" },
    { value: 4, label: "4+ stars" },
    { value: 3, label: "3+ stars" },
  ],
};
