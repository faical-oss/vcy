import { fnv1a } from "@/helpers/seeded-pick";
import { slugify } from "@/helpers/slugify";
import type { Destination } from "@/interfaces";
import { destinations as homeDestinations } from "../home/destinations";
import { IMAGE_POOLS, type ImageTheme } from "./images";

/**
 * ASSUMED mock facts. Only Bali, Thailand and Italy use values seen in the reference prototype; everything else
 * (best time, stay, counts, prices, intros) is plausible placeholder content to be replaced by Trip Fusion data.
 */
interface DestinationRow {
  /** Menu label; its slug is the destination slug. */
  label: string;
  /** Display name when it differs from the menu label ("Bali, Indonesia" is shown as "Bali"). */
  name?: string;
  region: string;
  country?: string;
  /** Text before the count in the subtitle ("Indonesia · 240+ experiences"). */
  area: string;
  bestTime: string;
  nights: number;
  count: number;
  from: number;
  scene: ImageTheme;
  intro: string;
}

const ROWS: readonly DestinationRow[] = [
  // Asia
  { label: "Bali, Indonesia", name: "Bali", region: "Asia", country: "Indonesia", area: "Indonesia", bestTime: "Apr – Oct", nights: 10, count: 240, from: 899, scene: "tropical", intro: "Bali blends rice-terrace villages, surf coves and a deep yoga tradition. Ubud is the centre for retreats, while Canggu and Uluwatu add surf and beach days." },
  { label: "Thailand", region: "Asia", area: "Southeast Asia", bestTime: "Nov – Apr", nights: 9, count: 310, from: 749, scene: "tropical", intro: "From Chiang Mai's quiet hill retreats to the island resorts of Koh Samui and Phuket, Thailand is a wellness favourite for detox programmes, Thai massage and meditation." },
  { label: "India", region: "Asia", area: "South Asia", bestTime: "Oct – Mar", nights: 9, count: 275, from: 649, scene: "hiking", intro: "India is the home of yoga and Ayurveda, with immersive retreats in Rishikesh, Kerala and the Himalayan foothills." },
  { label: "Nepal", region: "Asia", area: "South Asia", bestTime: "Mar – May", nights: 10, count: 90, from: 799, scene: "hiking", intro: "Trek among Himalayan peaks, then slow down with meditation and Buddhist teachings in the Kathmandu valley." },
  { label: "Sri Lanka", region: "Asia", area: "South Asia", bestTime: "Dec – Mar", nights: 8, count: 95, from: 849, scene: "tropical", intro: "Ayurvedic spas, tea-country hikes and palm-fringed beaches sit within a short drive of each other." },
  { label: "Vietnam", region: "Asia", area: "Southeast Asia", bestTime: "Feb – Apr", nights: 8, count: 60, from: 699, scene: "tropical", intro: "Coastal yoga retreats, cycling through rice paddies and a food culture built on fresh herbs." },
  { label: "Japan", region: "Asia", area: "East Asia", bestTime: "Mar – May", nights: 9, count: 140, from: 1299, scene: "wellness", intro: "Hot-spring towns, temple stays and forest bathing make Japan a calm, precise setting for restorative travel." },
  { label: "Cambodia", region: "Asia", area: "Southeast Asia", bestTime: "Nov – Mar", nights: 7, count: 40, from: 649, scene: "jungle", intro: "Small wellness retreats near Siem Reap pair temple visits with yoga and quiet countryside cycling." },
  { label: "Maldives", region: "Asia", area: "Indian Ocean", bestTime: "Nov – Apr", nights: 6, count: 85, from: 1899, scene: "water", intro: "Overwater villas, house reefs and private-island spa resorts make the Maldives a destination for rest and diving." },
  { label: "Malaysia", region: "Asia", area: "Southeast Asia", bestTime: "Mar – Oct", nights: 7, count: 45, from: 599, scene: "jungle", intro: "Rainforest lodges in Borneo and island retreats off the east coast offer nature-led wellness at gentle prices." },
  { label: "Philippines", region: "Asia", area: "Southeast Asia", bestTime: "Dec – May", nights: 8, count: 55, from: 749, scene: "tropical", intro: "Island-hopping yoga weeks, freediving courses and beachfront detox programmes across Palawan and the Visayas." },
  // Europe
  { label: "Italy", region: "Europe", area: "Europe", bestTime: "Apr – Jun", nights: 8, count: 190, from: 749, scene: "countryside", intro: "Tuscan farm retreats, Ligurian coastal trails and Umbrian meditation weeks. Italy rewards slow travel, good food and thermal waters." },
  { label: "Spain", region: "Europe", area: "Europe", bestTime: "Apr – Jun", nights: 7, count: 85, from: 699, scene: "coast", intro: "Medical wellness clinics on the Costa Blanca and yoga retreats in Andalusian hill villages." },
  { label: "Greece", region: "Europe", area: "Europe", bestTime: "May – Oct", nights: 8, count: 155, from: 799, scene: "coast", intro: "Seaside villas on Crete and the Cyclades host yoga, hiking and Mediterranean cooking programmes." },
  { label: "Portugal", region: "Europe", area: "Europe", bestTime: "Apr – Oct", nights: 7, count: 70, from: 649, scene: "coast", intro: "Surf and yoga on the Algarve and Alentejo coasts, plus quiet quintas in the Douro valley." },
  { label: "France", region: "Europe", area: "Europe", bestTime: "May – Sep", nights: 7, count: 80, from: 799, scene: "countryside", intro: "Spa towns, vineyard retreats and long cycling routes from the Loire Valley to the Pyrenees." },
  { label: "Croatia", region: "Europe", area: "Europe", bestTime: "May – Sep", nights: 7, count: 40, from: 699, scene: "coast", intro: "Adriatic island retreats combine sailing, sea swimming and yoga on the water." },
  { label: "Turkey", region: "Europe", area: "Europe", bestTime: "Apr – Jun", nights: 7, count: 50, from: 599, scene: "coast", intro: "Hammam traditions and Aegean coast retreats at some of the best-value rates in the region." },
  { label: "Switzerland", region: "Europe", area: "Europe", bestTime: "Jun – Sep", nights: 6, count: 45, from: 1499, scene: "hiking", intro: "Alpine health clinics and mountain walking weeks centred on longevity and recovery." },
  { label: "Austria", region: "Europe", area: "Europe", bestTime: "Jun – Sep", nights: 6, count: 35, from: 999, scene: "hiking", intro: "Thermal spas, Alpine hiking and traditional fasting cures in small mountain hotels." },
  { label: "UK & Ireland", region: "Europe", area: "Europe", bestTime: "May – Sep", nights: 5, count: 60, from: 549, scene: "countryside", intro: "Country-house spas, coastal walking and wild-swimming retreats close to home for many travellers." },
  { label: "Iceland", region: "Europe", area: "Europe", bestTime: "Jun – Aug", nights: 5, count: 30, from: 1199, scene: "wellness", intro: "Geothermal lagoons, volcanic landscapes and quiet retreats under the midnight sun or the northern lights." },
  // Americas
  { label: "Costa Rica", region: "Americas", area: "Central America", bestTime: "Dec – Apr", nights: 8, count: 120, from: 899, scene: "jungle", intro: "Rainforest lodges, Pacific surf and yoga shalas make Costa Rica a leader in nature-based wellness." },
  { label: "Mexico", region: "Americas", area: "North America", bestTime: "Nov – Apr", nights: 7, count: 90, from: 699, scene: "jungle", intro: "Cenote swims, beach yoga on the Riviera Maya and temazcal ceremonies in the mountains." },
  { label: "Peru", region: "Americas", area: "South America", bestTime: "May – Sep", nights: 9, count: 55, from: 899, scene: "hiking", intro: "Sacred Valley retreats and high-altitude treks toward Machu Picchu." },
  { label: "Colombia", region: "Americas", area: "South America", bestTime: "Dec – Mar", nights: 8, count: 35, from: 749, scene: "jungle", intro: "Coffee-region fincas and Caribbean coast hideaways with a growing wellness scene." },
  { label: "Brazil", region: "Americas", area: "South America", bestTime: "May – Sep", nights: 8, count: 40, from: 849, scene: "tropical", intro: "Beach retreats in Bahia and rainforest stays with surf, capoeira and yoga." },
  { label: "Ecuador", region: "Americas", area: "South America", bestTime: "Jun – Sep", nights: 8, count: 30, from: 799, scene: "jungle", intro: "Cloud-forest lodges and Andean haciendas within a short flight of the Galápagos." },
  { label: "Guatemala", region: "Americas", area: "Central America", bestTime: "Nov – Apr", nights: 7, count: 25, from: 649, scene: "jungle", intro: "Lake Atitlán is known for yoga and meditation retreats set among volcanoes." },
  { label: "USA", region: "Americas", area: "North America", bestTime: "Mar – Jun", nights: 6, count: 130, from: 999, scene: "wellness", intro: "Desert spa resorts in Arizona, California wellness ranches and mountain retreats across the country." },
  { label: "Canada", region: "Americas", area: "North America", bestTime: "Jun – Sep", nights: 6, count: 50, from: 899, scene: "hiking", intro: "Rocky Mountain lodges, Nordic spas and forest retreats on the west coast." },
  { label: "Argentina", region: "Americas", area: "South America", bestTime: "Oct – Apr", nights: 8, count: 30, from: 799, scene: "hiking", intro: "Patagonian trekking and Mendoza vineyard retreats." },
  { label: "Chile", region: "Americas", area: "South America", bestTime: "Nov – Mar", nights: 8, count: 30, from: 849, scene: "hiking", intro: "Atacama desert stargazing, Patagonian trails and thermal lodges in the Andes." },
  // Africa & Middle East
  { label: "Kenya", region: "Africa & Middle East", area: "East Africa", bestTime: "Jul – Oct", nights: 7, count: 45, from: 1599, scene: "countryside", intro: "Safari camps with yoga decks and spa tents, timed around the great migration." },
  { label: "Tanzania", region: "Africa & Middle East", area: "East Africa", bestTime: "Jun – Oct", nights: 8, count: 40, from: 1699, scene: "countryside", intro: "Serengeti safaris and Kilimanjaro treks, often paired with beach recovery on Zanzibar." },
  { label: "South Africa", region: "Africa & Middle East", area: "Southern Africa", bestTime: "Sep – Mar", nights: 8, count: 55, from: 999, scene: "coast", intro: "Cape winelands spas, Garden Route trails and private game reserves." },
  { label: "Morocco", region: "Africa & Middle East", area: "North Africa", bestTime: "Mar – May", nights: 7, count: 70, from: 699, scene: "wellness", intro: "Riads in Marrakech, hammam rituals and yoga weeks in the Atlas Mountains or on the Atlantic coast." },
  { label: "Egypt", region: "Africa & Middle East", area: "North Africa", bestTime: "Oct – Apr", nights: 7, count: 30, from: 699, scene: "water", intro: "Red Sea diving and detox retreats, with Nile cruises for culture." },
  { label: "Jordan", region: "Africa & Middle East", area: "Middle East", bestTime: "Mar – May", nights: 6, count: 25, from: 899, scene: "wellness", intro: "Dead Sea spa stays, Wadi Rum desert camps and walking trails to Petra." },
  { label: "Dubai", region: "Africa & Middle East", country: "United Arab Emirates", area: "Middle East", bestTime: "Nov – Mar", nights: 5, count: 35, from: 1099, scene: "coast", intro: "Luxury spa hotels, desert wellness camps and year-round fitness programmes." },
  { label: "Oman", region: "Africa & Middle East", area: "Middle East", bestTime: "Oct – Apr", nights: 7, count: 25, from: 999, scene: "coast", intro: "Fjord-like coastlines, desert dunes and quiet beach resorts focused on recovery." },
  { label: "Zanzibar", region: "Africa & Middle East", country: "Tanzania", area: "East Africa", bestTime: "Jun – Oct", nights: 7, count: 30, from: 1099, scene: "tropical", intro: "White-sand beaches, spice-farm visits and boutique retreats on the Indian Ocean." },
  { label: "Rwanda", region: "Africa & Middle East", area: "East Africa", bestTime: "Jun – Sep", nights: 6, count: 15, from: 1899, scene: "jungle", intro: "Gorilla trekking, volcano hikes and small eco-lodges in the hills." },
  // Oceania & Pacific
  { label: "Australia", region: "Oceania & Pacific", area: "Oceania", bestTime: "Sep – Nov", nights: 8, count: 80, from: 1099, scene: "coast", intro: "Byron Bay yoga, reef diving in Queensland and outback walking journeys." },
  { label: "New Zealand", region: "Oceania & Pacific", area: "Oceania", bestTime: "Dec – Mar", nights: 8, count: 55, from: 1199, scene: "hiking", intro: "Great Walks, geothermal spas and lakeside lodges." },
  { label: "Fiji", region: "Oceania & Pacific", area: "South Pacific", bestTime: "May – Oct", nights: 7, count: 30, from: 1299, scene: "tropical", intro: "Island resorts with traditional massage, snorkelling and village visits." },
  { label: "French Polynesia", region: "Oceania & Pacific", area: "South Pacific", bestTime: "May – Oct", nights: 7, count: 25, from: 2199, scene: "tropical", intro: "Overwater bungalows, lagoon diving and slow days on Tahiti, Moorea and Bora Bora." },
  { label: "Vanuatu", region: "Oceania & Pacific", area: "South Pacific", bestTime: "May – Oct", nights: 7, count: 10, from: 1099, scene: "tropical", intro: "Volcano hikes, reef snorkelling and small beach lodges." },
  { label: "Hawaii", region: "Oceania & Pacific", country: "USA", area: "North Pacific", bestTime: "Apr – Jun", nights: 7, count: 45, from: 1399, scene: "tropical", intro: "Surf lessons, volcano trails and oceanfront spa resorts across the islands." },
  { label: "Cook Islands", region: "Oceania & Pacific", area: "South Pacific", bestTime: "May – Oct", nights: 7, count: 10, from: 1499, scene: "tropical", intro: "Quiet lagoons and family-run retreats away from the crowds." },
  // Indian Ocean (Maldives, Sri Lanka and Zanzibar are listed above)
  { label: "Seychelles", region: "Indian Ocean", area: "Indian Ocean", bestTime: "Apr – May", nights: 7, count: 30, from: 1699, scene: "tropical", intro: "Granite coves and private-island resorts with spa programmes." },
  { label: "Mauritius", region: "Indian Ocean", area: "Indian Ocean", bestTime: "May – Dec", nights: 7, count: 40, from: 1199, scene: "tropical", intro: "Beach resorts with Ayurveda and yoga programmes, plus hiking in the island's mountains." },
  { label: "Réunion", region: "Indian Ocean", country: "France", area: "Indian Ocean", bestTime: "May – Oct", nights: 7, count: 15, from: 999, scene: "hiking", intro: "Volcanic cirques and walking trails alongside lagoon beaches." },
  { label: "Madagascar", region: "Indian Ocean", area: "Indian Ocean", bestTime: "Apr – Nov", nights: 9, count: 15, from: 1399, scene: "jungle", intro: "Lemur reserves, baobab avenues and remote island lodges." },
];

/** Photos already used for these destinations on the Home page. */
const homeImageByName = new Map(homeDestinations.map((home) => [home.name, home.imageSrc]));

function heroFor(row: DestinationRow, slug: string): string {
  const name = row.name ?? row.label;
  const pool = IMAGE_POOLS[row.scene];
  return homeImageByName.get(name) ?? pool[fnv1a(slug) % pool.length];
}

export const destinationRegistry: Destination[] = ROWS.map((row) => {
  const slug = slugify(row.label);
  return {
    slug,
    name: row.name ?? row.label,
    region: row.region,
    ...(row.country ? { country: row.country } : {}),
    subtitle: `${row.area} · ${row.count}+ experiences`,
    bestTimeToVisit: row.bestTime,
    averageStay: `${row.nights} nights`,
    experienceCount: row.count,
    fromPrice: { amount: row.from, currency: "USD" },
    intro: row.intro,
    heroImage: heroFor(row, slug),
  };
});

/** Numeric "from" price (USD) per destination slug; `Destination.fromPrice` is the formatted string of the same value. */
export const destinationFromPrice: Readonly<Record<string, number>> = Object.fromEntries(ROWS.map((row) => [slugify(row.label), row.from]));

export const destinationBySlug = new Map(destinationRegistry.map((entry) => [entry.slug, entry]));
