import "server-only";
import type { Favorite, FavoriteRef } from "@/interfaces";
import { getAccountService } from "@/services";

/** Turns saved ids into the public card data the favorites page renders. Requires a session; order follows `refs`. */
export async function resolveFavorites(refs: readonly FavoriteRef[]): Promise<Favorite[]> {
  return (await getAccountService()).resolveFavorites(refs);
}
