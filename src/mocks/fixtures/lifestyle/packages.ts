import type { LifestylePackageRecord } from "@/interfaces";
import { photo, proto } from "./assets";

const usd = (amount: number) => ({ amount, currency: "USD" });

/**
 * The packages of all Lifestyle pages in one table, referenced by id (the same package is on several pages).
 * TODO(api): package data, prices and photos come from Trip Fusion. There are no ratings on purpose: the prototype's
 * "4.9 (124)" was a placeholder, and a rating must never be shown as if it were real.
 */
export const lifestylePackages: readonly LifestylePackageRecord[] = [
  { id: "nicaragua-surf-week", title: "Surf & Active Adventure Week In Nicaragua", provider: "Emerald Coast Adventure Camp", location: "Popoyo, Nicaragua", nights: 7, price: usd(1995), images: [proto("lifestyle/adventure/d395f.png")] },
  { id: "costa-rica-volcano", title: "Volcano Trails & Pacific Waves", provider: "Costa Rica Adventure Lodge", location: "Guanacaste, Costa Rica", nights: 6, price: usd(2450), images: [photo("1781193521240-229f21350753")] },
  { id: "patagonia-peaks", title: "Patagonia Peaks Expedition", provider: "Awasi Patagonia", location: "Torres del Paine, Chile", nights: 8, price: usd(3890), images: [photo("1788070638029-5a2095f49a1b")] },
  { id: "moab-reset", title: "High Desert Adventure Reset", provider: "Desert Basecamp", location: "Moab, Utah", nights: 5, price: usd(2150), images: [photo("1788072848036-0b00c6d649d2")] },

  { id: "williamsburg-golf", title: "Williamsburg Championship Golf Escape", provider: "Williamsburg Inn", location: "Williamsburg, Virginia", nights: 4, price: usd(1895), images: [photo("1780702828814-b9ac93cf01a9")] },
  { id: "virginia-golf-spa", title: "Golf & Spa Weekend In Virginia", provider: "Colonial Williamsburg Resort", location: "Williamsburg, Virginia", nights: 3, price: usd(1450), images: [photo("1775686318424-9987122d8402")] },
  { id: "scottish-links", title: "The Great Scottish Links Journey", provider: "Links House", location: "Scottish Highlands", nights: 7, price: usd(4250), images: [photo("1793353999801-ae0e51819922")] },
  { id: "costa-rica-golf", title: "Costa Rica Golf & Wellness Week", provider: "Reserva Conchal", location: "Guanacaste, Costa Rica", nights: 6, price: usd(3195), images: [photo("1775326376274-2ef7f5f9de8f")] },

  { id: "south-tyrol-glow-flow", title: "Glow & Flow Menopause Retreat In Italy", provider: "South Tyrol Wellness Estate", location: "South Tyrol, Italy", nights: 7, price: usd(3480), images: [photo("1603983616619-faf118d6c374")] },
  { id: "joshua-tree-solo", title: "3-Day Solo Transformational Retreat in Joshua Tree", provider: "Camp Vortex", location: "Joshua Tree, California", nights: 2, price: usd(2200), images: [photo("1610295272575-7376b67b3e96")] },
  { id: "pisgah-holistic", title: "Holistic Wellness: Fitness, Mindfulness & Nutrition", provider: "Pisgah Wellness Retreat", location: "Pisgah Forest, North Carolina", nights: 7, price: usd(4270), images: [proto("lifestyle/meditation/289e6.png")] },

  { id: "evia-thermal", title: "Thermal Spa Wellness Retreats In Greece", provider: "Thermae Sylla Spa", location: "Evia, Greece", nights: 7, price: usd(2790), images: [proto("lifestyle/spa/f8496.png")] },
  { id: "belize-all-inclusive", title: "Reconnect With Wellness: Ultimate All-Inclusive", provider: "Naia Resort and Spa", location: "Placencia, Belize", nights: 4, price: usd(3150), images: [proto("lifestyle/spa/ff447.png")] },

  { id: "bali-soul-surf", title: "Bali Soul & Surf", provider: "Fivelements Retreat Bali", location: "Bali, Indonesia", nights: 7, price: usd(2495), images: [photo("1537996194471-e657df975ab4")] },
  { id: "tuscany-wellness", title: "Tuscany Wellness Retreat", provider: "Borgo Santo Pietro", location: "Tuscany, Italy", nights: 5, price: usd(3195), images: [photo("1523531294919-4bcd7c65e216")] },
  { id: "maldives-escape", title: "Maldives Wellness Escape", provider: "JOALI BEING", location: "Maldives", nights: 6, price: usd(4850), images: [photo("1512343879784-a960bf40e7f2")] },
  { id: "yoga-surf-nicaragua", title: "Signature Yoga & Surf Retreat", provider: "Morgan's Rock Hacienda & Ecolodge", location: "San Juan del Sur, Nicaragua", nights: 7, price: usd(1899), images: [proto("yoga/yoga-surf-retreat.png")] },
];

export const packageById = new Map(lifestylePackages.map((record) => [record.id, record]));
