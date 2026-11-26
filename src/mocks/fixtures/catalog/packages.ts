import { packages as homePackages } from "../home/packages";
import type { PackageRecord } from "./types";

const homeById = new Map(homePackages.map((card) => [card.id, card]));

function packageRecord(id: string, destinationSlug: string): PackageRecord {
  const card = homeById.get(id);
  if (!card) throw new Error(`Unknown home package in catalog fixture: ${id}`);
  return { card, destinationSlug };
}

/** The 8 Home packages with an explicit destination (typed by hand, checked against the destination registry in tests). */
export const packageRecords: PackageRecord[] = [
  packageRecord("bali-soul-surf", "bali-indonesia"),
  packageRecord("tuscany-wellness", "italy"),
  packageRecord("maldives-escape", "maldives"),
  packageRecord("pura-vida", "costa-rica"),
  packageRecord("cyclades", "greece"),
  packageRecord("himalaya", "nepal"),
  packageRecord("kerala", "india"),
  packageRecord("samui-detox", "thailand"),
];
