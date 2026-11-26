/**
 * ASSUMED mock content, second part of the hotel detail seeds (see hotel-details.ts): the "nearest beach" style fact of the
 * Location tab and three more nearby attractions per hotel (six in all). Invented placeholders that fit each hotel's place.
 */
export interface HotelDetailExtra {
  /** [label, value] of the third transport fact ("Nearest beach", "Nearest lake"...). */
  nearby: [string, string];
  /** [name, distance] x 3, added to the three in the main seed. */
  moreAttractions: [string, string][];
}

export const hotelDetailExtras: Record<string, HotelDetailExtra> = {
  "azure-spa-and-wellness-resort": { nearby: ["Nearest beach", "Ao Nang Beach · 9 km"], moreAttractions: [["Krabi Town Night Market", "14 km"], ["Hong Islands (by boat)", "20 km"], ["Wat Kaew Korawaram", "15 km"]] },
  "six-senses-zighy-bay": { nearby: ["Nearest beach", "Zighy Bay beach · On site"], moreAttractions: [["Khor Najd viewpoint", "28 km"], ["Bukha Fort", "38 km"], ["Dibba village", "60 km"]] },
  "como-uma-ubud": { nearby: ["Nearest beach", "Sanur · 38 km"], moreAttractions: [["Goa Gajah", "7 km"], ["Ubud Palace", "3 km"], ["Saraswati Temple", "3 km"]] },
  "chiva-som-hua-hin": { nearby: ["Nearest beach", "Hua Hin Beach · On site"], moreAttractions: [["Hua Hin Night Market", "5 km"], ["Wat Huay Mongkol", "14 km"], ["Pranburi Forest Park", "45 km"]] },
  "sha-wellness-clinic-alicante": { nearby: ["Nearest beach", "Altea beach · 7 km"], moreAttractions: [["Guadalest", "25 km"], ["Benidorm", "12 km"], ["Villajoyosa", "22 km"]] },
  "clinique-la-prairie-montreux": { nearby: ["Nearest lake", "Lake Geneva shore · 0.3 km"], moreAttractions: [["Lausanne", "28 km"], ["Vevey", "6 km"], ["Lavaux vineyards", "15 km"]] },
  "aman-tokyo": { nearby: ["Nearest station", "Tokyo Station · 0.8 km"], moreAttractions: [["Tokyo Skytree", "8 km"], ["Meiji Shrine", "7 km"], ["Tsukiji Outer Market", "3 km"]] },
  "anantara-kihavah-villas": { nearby: ["Nearest beach", "Resort beach · On site"], moreAttractions: [["Dharavandhoo island", "15 km"], ["Thulhaadhoo village", "12 km"], ["Maalhos island", "14 km"]] },
  "palazzo-fiuggi": { nearby: ["Nearest lake", "Lago di Canterno · 12 km"], moreAttractions: [["Alatri acropolis", "20 km"], ["Collepardo caves", "25 km"], ["Veroli", "35 km"]] },
  "banyan-tree-ungasan": { nearby: ["Nearest beach", "Suluban Beach · 9 km"], moreAttractions: [["Bingin Beach", "6 km"], ["Melasti Beach", "7 km"], ["Jimbaran Bay", "18 km"]] },
  "soneva-fushi": { nearby: ["Nearest beach", "Island beach · On site"], moreAttractions: [["Eydhafushi island", "20 km"], ["Kudarah Thila dive site", "15 km"], ["Fushi Kandu", "3 km"]] },
  "alila-villas-uluwatu": { nearby: ["Nearest beach", "Padang Padang · 8 km"], moreAttractions: [["Bingin Beach", "5 km"], ["Dreamland Beach", "6 km"], ["Uluwatu Kecak dance", "3 km"]] },
  "pacific-canopy-eco-lodge": { nearby: ["Nearest beach", "Playa Santa Teresa · 8 km"], moreAttractions: [["Playa Hermosa", "12 km"], ["Mal País", "14 km"], ["Curú Wildlife Refuge", "45 km"]] },
  "himalayan-stone-lodge": { nearby: ["Nearest lake", "Begnas Lake · 12 km"], moreAttractions: [["Davis Falls", "8 km"], ["Gupteshwor Cave", "8 km"], ["Bindhyabasini Temple", "6 km"]] },
  "kerala-backwater-eco-retreat": { nearby: ["Nearest beach", "Marari Beach · 17 km"], moreAttractions: [["Vembanad Lake", "3 km"], ["Pathiramanal island", "25 km"], ["Krishnapuram Palace", "40 km"]] },
  "cretan-olive-grove-lodge": { nearby: ["Nearest beach", "Georgioupoli beach · 25 km"], moreAttractions: [["Lake Kournas", "28 km"], ["Eleftherna archaeological site", "12 km"], ["Margarites pottery village", "10 km"]] },
  "chianti-farm-lodge": { nearby: ["Nearest station", "Florence Santa Maria Novella · 35 km"], moreAttractions: [["Panzano in Chianti", "7 km"], ["Radda in Chianti", "18 km"], ["Badia a Passignano", "12 km"]] },
  "ubud-rice-terrace-lodge": { nearby: ["Nearest temple", "Gunung Kawi · 8 km"], moreAttractions: [["Campuhan Ridge Walk", "11 km"], ["Ubud Monkey Forest", "10 km"], ["Goa Gajah", "12 km"]] },
  "finca-serena-boutique-retreat": { nearby: ["Nearest beach", "Playa de Formentor · 20 km"], moreAttractions: [["Sa Calobra", "35 km"], ["Port de Pollença", "8 km"], ["Lluc monastery", "28 km"]] },
  "palm-cove-beach-resort": { nearby: ["Nearest beach", "Resort beach · On site"], moreAttractions: [["Playa Flamingo", "12 km"], ["Brasilito village", "10 km"], ["Diriá National Park", "50 km"]] },
};
