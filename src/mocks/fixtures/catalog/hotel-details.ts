import type { AmenityIcon } from "@/interfaces";

/**
 * ASSUMED mock content for the hotel detail pages: one seed per catalog hotel, keyed by the hotel's card id. Descriptions,
 * distances, coordinates (approximate), attractions, languages and policies are invented placeholders that fit each
 * hotel's place and type; they are NOT facts about real properties. Replace with Trip Fusion data.
 */
export interface HotelDetailSeed {
  description: [string, string];
  /** [latitude, longitude], approximate. */
  coordinates: [number, number];
  /** [name, km, minutes by car]. */
  airport: [string, number, number];
  centre: [string, number, number];
  /** [name, distance text]. */
  attractions: [string, string][];
  languages: string;
  stay: { checkIn: string; checkOut: string; minNights: number; pets: string };
  /** Exactly nine: [icon, label]. */
  amenities: [AmenityIcon, string][];
  /** Board of the entry room; richer rooms add to it. */
  board: string;
  /** Names of the three room types, entry first. */
  roomNames: [string, string, string];
}

const RESORT_ROOMS: [string, string, string] = ["Deluxe Garden Room", "Spa Suite", "Pool Villa"];
const LODGE_ROOMS: [string, string, string] = ["Garden Cabin", "Canopy Suite", "Family Lodge"];
const STANDARD_STAY = { checkIn: "3:00 PM", checkOut: "12:00 PM", minNights: 2, pets: "Not permitted" };

export const hotelDetailSeeds: Record<string, HotelDetailSeed> = {
  "azure-spa-and-wellness-resort": {
    description: [
      "Azure Spa & Wellness Resort sits on a quiet stretch of the Andaman coast near Krabi, between limestone cliffs and a long private beach. The resort is built around its spa, with a daily yoga schedule and treatment programmes planned with a wellness host on arrival.",
      "Rooms are set in tropical gardens a short walk from the sea. Meals centre on fresh seafood and plant-based Thai cooking, and boat trips to nearby islands can be arranged by the concierge.",
    ],
    coordinates: [8.0863, 98.9063],
    airport: ["Krabi International Airport", 32, 40],
    centre: ["Krabi Town", 14, 25],
    attractions: [["Railay Beach (by boat)", "4 km"], ["Tiger Cave Temple", "17 km"], ["Emerald Pool", "52 km"]],
    languages: "English, Thai",
    stay: STANDARD_STAY,
    amenities: [["pool", "Infinity pool"], ["spa", "Spa and treatment rooms"], ["yoga", "Daily yoga classes"], ["dining", "2 restaurants"], ["beach", "Private beach"], ["fitness", "Fitness centre"], ["activity", "Island boat trips"], ["service", "Concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: RESORT_ROOMS,
  },
  "six-senses-zighy-bay": {
    description: [
      "Six Senses Zighy Bay is a beachfront resort on the Musandam Peninsula, where mountains drop to a sheltered bay. Its spa and sleep programme are the focus of most stays, alongside mountain hikes and time on the water.",
      "Villas are spread between the beach and the hillside, with private pools. Dining leans on produce from the resort's own garden and local fishermen.",
    ],
    coordinates: [26.06, 56.235],
    airport: ["Khasab Airport", 45, 60],
    centre: ["Khasab", 40, 55],
    attractions: [["Zighy Bay beach", "On site"], ["Musandam fjords (by dhow)", "35 km"], ["Khasab Fort", "40 km"]],
    languages: "English, Arabic",
    stay: { ...STANDARD_STAY, checkIn: "2:00 PM", minNights: 3 },
    amenities: [["pool", "Private pool villas"], ["spa", "Spa and sleep programme"], ["dining", "Organic garden dining"], ["beach", "Beachfront"], ["fitness", "Fitness centre"], ["activity", "Guided mountain hikes"], ["yoga", "Yoga pavilion"], ["service", "24-hour room service"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Garden Villa", "Beach Pool Villa", "Hilltop Pool Villa"],
  },
  "como-uma-ubud": {
    description: [
      "COMO Uma Ubud overlooks the Tjampuhan ridge on the edge of Ubud, a short drive from the town's markets and galleries. The resort is organised around yoga, meditation and spa treatments, with a daily class schedule open to guests.",
      "Rooms and villas face the river valley or the gardens. The restaurant serves a menu of Balinese and healthy international dishes.",
    ],
    coordinates: [-8.5069, 115.2625],
    airport: ["Ngurah Rai International Airport", 38, 75],
    centre: ["Ubud centre", 2.5, 8],
    attractions: [["Ubud Monkey Forest", "2.8 km"], ["Campuhan Ridge Walk", "0.5 km"], ["Tegallalang rice terraces", "11 km"]],
    languages: "English, Bahasa Indonesia",
    stay: STANDARD_STAY,
    amenities: [["yoga", "Yoga and meditation studio"], ["spa", "Spa"], ["pool", "Valley-view pool"], ["dining", "Restaurant and bar"], ["fitness", "Fitness centre"], ["nature", "Ridge and rice-field walks"], ["wellness", "Wellness consultations"], ["service", "Concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Terrace Room", "Valley Suite", "Pool Villa"],
  },
  "chiva-som-hua-hin": {
    description: [
      "Chiva-Som is a destination health resort on the beach at Hua Hin, built around residential wellness programmes of a week or more. Stays begin with a consultation, and treatments, fitness classes and meals are planned around it.",
      "The grounds include a hydrotherapy suite, a fitness studio and several pools. Meals are included and follow the chosen programme.",
    ],
    coordinates: [12.5684, 99.9577],
    airport: ["Hua Hin Airport", 8, 15],
    centre: ["Hua Hin town", 5, 12],
    attractions: [["Hua Hin Railway Station", "5 km"], ["Cicada Market", "6 km"], ["Khao Sam Roi Yot National Park", "60 km"]],
    languages: "English, Thai",
    stay: { ...STANDARD_STAY, minNights: 3 },
    amenities: [["wellness", "Medical spa"], ["spa", "Hydrotherapy"], ["fitness", "Fitness studio"], ["pool", "Pools"], ["dining", "Healthy cuisine"], ["yoga", "Yoga and Pilates"], ["beach", "Beachfront"], ["service", "Programme consultations"], ["transfer", "Airport transfers"]],
    board: "Full wellness board",
    roomNames: ["Garden Room", "Ocean Suite", "Pavilion Suite"],
  },
  "sha-wellness-clinic-alicante": {
    description: [
      "SHA Wellness Clinic sits in the hills above the coast near Alicante, combining a medical clinic with a hotel. Guests follow programmes for weight, sleep, stress or detox, planned after an initial medical consultation.",
      "Meals follow a macrobiotic menu, and treatments range from physiotherapy to spa therapies. Rooms look over the sea or the hills.",
    ],
    coordinates: [38.5865, -0.0705],
    airport: ["Alicante-Elche Airport", 60, 55],
    centre: ["Altea", 6, 12],
    attractions: [["Altea old town", "6 km"], ["Sierra Helada Natural Park", "9 km"], ["Calpe and the Peñón de Ifach", "28 km"]],
    languages: "English, Spanish, French, German",
    stay: { ...STANDARD_STAY, minNights: 3 },
    amenities: [["wellness", "Medical clinic"], ["spa", "Spa"], ["dining", "Macrobiotic dining"], ["pool", "Indoor and outdoor pools"], ["fitness", "Fitness centre"], ["yoga", "Yoga and meditation"], ["nature", "Sea-view terraces"], ["service", "Programme coaching"], ["transfer", "Airport transfers"]],
    board: "Full board",
    roomNames: ["Deluxe Room", "Junior Suite", "Sea-View Suite"],
  },
  "clinique-la-prairie-montreux": {
    description: [
      "Clinique La Prairie is a longevity clinic and spa on the shore of Lake Geneva above Montreux. Stays centre on a medical check-up followed by a programme of treatments, nutrition and movement.",
      "The spa and pools face the lake and the Alps. The restaurant serves lighter dishes planned around each guest's programme.",
    ],
    coordinates: [46.4312, 6.9107],
    airport: ["Geneva Airport", 95, 70],
    centre: ["Montreux", 3, 8],
    attractions: [["Château de Chillon", "6 km"], ["Montreux Jazz Café", "3 km"], ["Rochers-de-Naye (by train)", "20 km"]],
    languages: "English, French, German",
    stay: { ...STANDARD_STAY, minNights: 3 },
    amenities: [["wellness", "Longevity clinic"], ["spa", "Spa"], ["pool", "Indoor pool"], ["nature", "Lake and Alps views"], ["dining", "Restaurant"], ["fitness", "Fitness centre"], ["yoga", "Movement classes"], ["service", "Concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Lake-View Room", "Deluxe Suite", "Prestige Suite"],
  },
  "aman-tokyo": {
    description: [
      "Aman Tokyo occupies the upper floors of a tower in Otemachi, with views over the Imperial Palace gardens and the city. The spa and a long pool on the top floor give the hotel its quiet, urban retreat character.",
      "Rooms are large and designed with Japanese materials. Guests can book treatments, a tea ceremony or a guided walk through the old neighbourhoods.",
    ],
    coordinates: [35.6852, 139.7646],
    airport: ["Haneda Airport", 17, 35],
    centre: ["Tokyo Station", 0.8, 5],
    attractions: [["Imperial Palace East Gardens", "0.7 km"], ["Ginza", "1.8 km"], ["Senso-ji Temple", "6 km"]],
    languages: "English, Japanese",
    stay: { ...STANDARD_STAY, checkIn: "3:00 PM", minNights: 1 },
    amenities: [["spa", "Spa"], ["pool", "Top-floor pool"], ["fitness", "Fitness centre"], ["dining", "Restaurants and bar"], ["wellness", "Tea ceremony"], ["activity", "Guided city walks"], ["yoga", "Studio classes"], ["service", "24-hour concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Deluxe Room", "Premier Suite", "Aman Suite"],
  },
  "anantara-kihavah-villas": {
    description: [
      "Anantara Kihavah Villas is a private-island resort in Baa Atoll, a UNESCO biosphere reserve, reached by seaplane from Malé. Villas stand over the lagoon or on the beach, most with their own pool.",
      "The resort has a spa, an underwater restaurant and an observatory. Snorkelling and diving trips visit the surrounding reefs.",
    ],
    coordinates: [5.1, 73.0],
    airport: ["Velana International Airport (seaplane)", 120, 35],
    centre: ["Eydhafushi", 18, 30],
    attractions: [["Hanifaru Bay (manta season)", "20 km"], ["House reef", "On site"], ["Local island visit", "18 km"]],
    languages: "English",
    stay: { ...STANDARD_STAY, minNights: 3 },
    amenities: [["pool", "Private pool villas"], ["spa", "Spa"], ["dining", "Undersea restaurant"], ["beach", "Private beach"], ["activity", "Diving and snorkelling"], ["fitness", "Fitness centre"], ["yoga", "Yoga sessions"], ["service", "Butler service"], ["transfer", "Seaplane transfers"]],
    board: "Breakfast included",
    roomNames: ["Beach Pool Villa", "Overwater Pool Villa", "Two-Bedroom Villa"],
  },
  "palazzo-fiuggi": {
    description: [
      "Palazzo Fiuggi is a spa hotel in the hills of Lazio, in the thermal town of Fiuggi, about an hour from Rome. The thermal spa and medical wellness programmes are its main draw, with a golf course in the grounds.",
      "Rooms are in the main palazzo and in garden wings. Dining ranges from light spa menus to regional Italian cooking.",
    ],
    coordinates: [41.8027, 13.2216],
    airport: ["Rome Fiumicino Airport", 110, 85],
    centre: ["Fiuggi", 1.5, 5],
    attractions: [["Fiuggi historic centre", "1.5 km"], ["Anagni cathedral", "30 km"], ["Rome", "85 km"]],
    languages: "English, Italian, French",
    stay: STANDARD_STAY,
    amenities: [["spa", "Thermal spa"], ["wellness", "Medical wellness"], ["activity", "Golf course"], ["pool", "Indoor and outdoor pools"], ["dining", "Restaurant"], ["fitness", "Fitness centre"], ["kids", "Family programmes"], ["service", "Concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Classic Room", "Junior Suite", "Palazzo Suite"],
  },
  "banyan-tree-ungasan": {
    description: [
      "Banyan Tree Ungasan stands on the cliffs of the Bukit Peninsula in southern Bali, above the Indian Ocean. Villas have private pools, and the clifftop spa and yoga pavilion look out over the sea.",
      "Beaches, temples and surf breaks are within a short drive. The resort's restaurants serve Balinese and Asian dishes, with a sunset bar on the cliff.",
    ],
    coordinates: [-8.8293, 115.1239],
    airport: ["Ngurah Rai International Airport", 20, 40],
    centre: ["Uluwatu village", 8, 20],
    attractions: [["Uluwatu Temple", "6 km"], ["Padang Padang Beach", "7 km"], ["Garuda Wisnu Kencana", "12 km"]],
    languages: "English, Bahasa Indonesia, Mandarin",
    stay: STANDARD_STAY,
    amenities: [["spa", "Clifftop spa"], ["pool", "Private pool villas"], ["yoga", "Yoga pavilion"], ["dining", "3 restaurants and bars"], ["fitness", "Fitness centre"], ["beach", "Beach access"], ["kids", "Kids club"], ["service", "24-hour room service"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Pool Villa", "Ocean-View Pool Villa", "Two-Bedroom Pool Villa"],
  },
  "soneva-fushi": {
    description: [
      "Soneva Fushi is a barefoot-luxury island resort in Baa Atoll, set in dense tropical vegetation. Villas open straight onto the beach, and the resort runs an observatory, a spa and a programme of conservation activities.",
      "The island is reached by seaplane from Malé. Dining is relaxed and based on produce from the resort's gardens.",
    ],
    coordinates: [5.1, 73.0667],
    airport: ["Velana International Airport (seaplane)", 130, 40],
    centre: ["Eydhafushi", 20, 35],
    attractions: [["Hanifaru Bay (manta season)", "22 km"], ["House reef", "On site"], ["Observatory", "On site"]],
    languages: "English",
    stay: { ...STANDARD_STAY, minNights: 3 },
    amenities: [["spa", "Spa"], ["nature", "Observatory"], ["dining", "Barefoot dining"], ["beach", "Beachfront villas"], ["kids", "Kids club"], ["activity", "Snorkelling and diving"], ["yoga", "Yoga"], ["service", "Villa host"], ["transfer", "Seaplane transfers"]],
    board: "Breakfast included",
    roomNames: ["Villa Suite", "Villa Suite with Pool", "Family Villa Suite"],
  },
  "alila-villas-uluwatu": {
    description: [
      "Alila Villas Uluwatu is a villa resort on a clifftop on the Bukit Peninsula, built in low volumes of local stone and thatch. Each villa has a private pool, and the main pool, spa and yoga deck face the ocean.",
      "The resort sits near some of Bali's best-known surf beaches and the Uluwatu clifftop temple.",
    ],
    coordinates: [-8.8185, 115.0888],
    airport: ["Ngurah Rai International Airport", 23, 45],
    centre: ["Uluwatu village", 5, 12],
    attractions: [["Uluwatu Temple", "3 km"], ["Suluban Beach", "4 km"], ["Pecatu village", "5 km"]],
    languages: "English, Bahasa Indonesia",
    stay: STANDARD_STAY,
    amenities: [["pool", "Private pool villas"], ["spa", "Spa"], ["yoga", "Yoga deck"], ["dining", "Restaurant and bar"], ["fitness", "Fitness centre"], ["beach", "Beach shuttle"], ["activity", "Surf lessons"], ["service", "Concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["One-Bedroom Villa", "Ocean-View Villa", "Two-Bedroom Villa"],
  },
  "pacific-canopy-eco-lodge": {
    description: [
      "Pacific Canopy Eco Lodge is a small lodge in the forest above the coast of the Nicoya Peninsula, with a yoga shala under the trees. Surf lessons and beach days are a short drive away.",
      "The lodge cooks with produce from its organic garden. Cabins are built from local wood and use solar hot water.",
    ],
    coordinates: [9.7489, -85.5],
    airport: ["Tambor Airport", 25, 35],
    centre: ["Santa Teresa", 8, 15],
    attractions: [["Santa Teresa beach", "8 km"], ["Cabo Blanco Reserve", "14 km"], ["Montezuma waterfalls", "22 km"]],
    languages: "English, Spanish",
    stay: { ...STANDARD_STAY, minNights: 2, pets: "On request" },
    amenities: [["yoga", "Yoga shala"], ["activity", "Surf lessons"], ["dining", "Organic dining"], ["nature", "Forest trails"], ["pool", "Plunge pool"], ["wellness", "Massage"], ["service", "Front desk"], ["transfer", "Airport transfers"], ["beach", "Beach shuttle"]],
    board: "Breakfast included",
    roomNames: LODGE_ROOMS,
  },
  "himalayan-stone-lodge": {
    description: [
      "Himalayan Stone Lodge is a small stone-built lodge above Pokhara, with views of the Annapurna range. A meditation hall and guided treks are the centre of a stay.",
      "Rooms are simple and warm, with wood stoves in the cooler months. Meals are vegetarian and made with local ingredients.",
    ],
    coordinates: [28.2096, 83.9856],
    airport: ["Pokhara International Airport", 9, 25],
    centre: ["Lakeside, Pokhara", 7, 20],
    attractions: [["Phewa Lake", "7 km"], ["World Peace Pagoda", "6 km"], ["Sarangkot viewpoint", "5 km"]],
    languages: "English, Nepali",
    stay: { ...STANDARD_STAY, checkIn: "1:00 PM", minNights: 2, pets: "On request" },
    amenities: [["yoga", "Meditation hall"], ["nature", "Mountain views"], ["activity", "Guided treks"], ["dining", "Vegetarian dining"], ["wellness", "Massage"], ["service", "Trek planning desk"], ["transfer", "Airport transfers"], ["fitness", "Morning stretching"], ["kids", "Family rooms"]],
    board: "Breakfast included",
    roomNames: LODGE_ROOMS,
  },
  "kerala-backwater-eco-retreat": {
    description: [
      "Kerala Backwater Eco Retreat lies on the edge of the backwaters near Alappuzha, with an Ayurveda centre and daily yoga. Canoe trips along the canals leave from the retreat's own jetty.",
      "Cottages are built from local materials and face the water or the coconut groves. Meals are Kerala home cooking, adjusted to each guest's Ayurvedic consultation.",
    ],
    coordinates: [9.4981, 76.3388],
    airport: ["Cochin International Airport", 85, 120],
    centre: ["Alappuzha", 9, 20],
    attractions: [["Alappuzha beach", "9 km"], ["Kumarakom bird sanctuary", "30 km"], ["Marari beach", "17 km"]],
    languages: "English, Malayalam, Hindi",
    stay: { ...STANDARD_STAY, minNights: 2 },
    amenities: [["wellness", "Ayurveda centre"], ["yoga", "Daily yoga"], ["activity", "Canoe trips"], ["dining", "Kerala cooking"], ["nature", "Backwater setting"], ["pool", "Pool"], ["spa", "Treatment rooms"], ["service", "Front desk"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Backwater Cottage", "Coconut Grove Suite", "Family Cottage"],
  },
  "cretan-olive-grove-lodge": {
    description: [
      "Cretan Olive Grove Lodge is a small farm stay among olive trees in the hills of Crete, with a spa and hiking trails that start at the gate. Beaches on the south coast are a drive away.",
      "Guests eat at a long table with produce from the farm. The lodge arranges walks through the nearby gorges and visits to local producers.",
    ],
    coordinates: [35.2401, 24.8093],
    airport: ["Chania International Airport", 55, 70],
    centre: ["Rethymno", 18, 25],
    attractions: [["Arkadi Monastery", "10 km"], ["Preveli beach", "42 km"], ["Rethymno old town", "18 km"]],
    languages: "English, Greek",
    stay: { ...STANDARD_STAY, minNights: 2 },
    amenities: [["dining", "Farm dining"], ["spa", "Spa"], ["activity", "Hiking trails"], ["pool", "Pool"], ["nature", "Olive grove"], ["kids", "Family rooms"], ["fitness", "Outdoor fitness area"], ["service", "Front desk"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: LODGE_ROOMS,
  },
  "chianti-farm-lodge": {
    description: [
      "Chianti Farm Lodge is a working organic farm in the Chianti hills, with a yoga barn and cooking classes in the farmhouse kitchen. The lodge sits among vineyards and olive groves, with walking paths from the door.",
      "Rooms are in restored stone buildings. Dinner is cooked from the farm's vegetables and local meat and cheese.",
    ],
    coordinates: [43.4668, 11.2543],
    airport: ["Florence Airport", 55, 60],
    centre: ["Greve in Chianti", 8, 15],
    attractions: [["Greve in Chianti", "8 km"], ["Castellina in Chianti", "14 km"], ["Siena", "35 km"]],
    languages: "English, Italian",
    stay: { ...STANDARD_STAY, minNights: 2, pets: "On request" },
    amenities: [["yoga", "Yoga barn"], ["dining", "Cooking classes"], ["nature", "Organic farm"], ["pool", "Pool"], ["activity", "Vineyard walks"], ["wellness", "Massage"], ["service", "Front desk"], ["transfer", "Station pick-up"], ["kids", "Family rooms"]],
    board: "Breakfast included",
    roomNames: ["Farmhouse Room", "Vineyard Suite", "Family Apartment"],
  },
  "ubud-rice-terrace-lodge": {
    description: [
      "Ubud Rice Terrace Lodge is a small lodge beside the rice fields north of Ubud, with a yoga shala and a vegan kitchen. The Tegallalang terraces and the town's markets are a short drive away.",
      "Rooms are simple and open to the fields. Mornings begin with yoga, and the lodge can arrange cycling and temple visits.",
    ],
    coordinates: [-8.4339, 115.2788],
    airport: ["Ngurah Rai International Airport", 45, 90],
    centre: ["Ubud centre", 9, 25],
    attractions: [["Tegallalang rice terraces", "2 km"], ["Tirta Empul temple", "9 km"], ["Ubud Palace", "9 km"]],
    languages: "English, Bahasa Indonesia",
    stay: { ...STANDARD_STAY, minNights: 1 },
    amenities: [["yoga", "Yoga shala"], ["nature", "Rice-field views"], ["dining", "Vegan dining"], ["pool", "Pool"], ["activity", "Cycling tours"], ["wellness", "Massage"], ["service", "Front desk"], ["transfer", "Airport transfers"], ["fitness", "Morning stretching"]],
    board: "Breakfast included",
    roomNames: LODGE_ROOMS,
  },
  "finca-serena-boutique-retreat": {
    description: [
      "Finca Serena Boutique Retreat is a restored country house in the hills of northern Mallorca, with a small pool, a yoga terrace and a kitchen garden. The sea and the Tramuntana trails are both a short drive away.",
      "Eleven rooms and suites share the gardens. Dinner is a set menu built around the garden and local producers, and the retreat arranges morning yoga and guided walks.",
    ],
    coordinates: [39.8436, 2.9916],
    airport: ["Palma de Mallorca Airport", 55, 55],
    centre: ["Pollença", 6, 12],
    attractions: [["Pollença old town", "6 km"], ["Cap de Formentor", "22 km"], ["Alcúdia old town", "14 km"]],
    languages: "English, Spanish, German",
    stay: { ...STANDARD_STAY, minNights: 2, pets: "On request" },
    amenities: [["pool", "Garden pool"], ["yoga", "Yoga terrace"], ["dining", "Set-menu dinners"], ["nature", "Kitchen garden"], ["activity", "Guided walks"], ["wellness", "Massage"], ["service", "Concierge"], ["transfer", "Airport transfers"], ["spa", "Sauna and treatment room"]],
    board: "Breakfast included",
    roomNames: ["Garden Room", "Terrace Suite", "Finca Suite"],
  },
  "palm-cove-beach-resort": {
    description: [
      "Palm Cove Beach Resort sits on a wide Pacific beach on the Guanacaste coast, with three pools, a children's club and a surf school on the sand. Most stays mix beach days with excursions to the nearby national parks.",
      "Rooms are in low buildings among palms, some with direct beach access. The resort has two restaurants and a beach bar, and can arrange horse riding, snorkelling and sunset sails.",
    ],
    coordinates: [10.5961, -85.7216],
    airport: ["Daniel Oduber Quirós Airport (Liberia)", 38, 45],
    centre: ["Tamarindo", 30, 40],
    attractions: [["Rincón de la Vieja National Park", "60 km"], ["Playa Conchal", "9 km"], ["Las Baulas National Marine Park", "28 km"]],
    languages: "English, Spanish",
    stay: STANDARD_STAY,
    amenities: [["beach", "Beachfront"], ["pool", "Three pools"], ["dining", "2 restaurants and a beach bar"], ["kids", "Children's club"], ["activity", "Surf school and snorkelling"], ["fitness", "Fitness centre"], ["spa", "Spa"], ["service", "Concierge"], ["transfer", "Airport transfers"]],
    board: "Breakfast included",
    roomNames: ["Garden Room", "Ocean View Suite", "Beachfront Villa"],
  },
};
