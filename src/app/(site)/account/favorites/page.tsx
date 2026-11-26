import type { Metadata } from "next";
import { AccountPageTitle } from "@/components/account/account-page-title";
import { FavoritesView } from "@/components/account/favorites-view";
import { ACCOUNT_PAGE_TITLES } from "@/constants/account";
import { resolveFavoritesAction } from "@/features/account/actions";

export const metadata: Metadata = { title: ACCOUNT_PAGE_TITLES.favorites, description: "Experiences, packages and hotels you have saved." };

export default async function AccountFavoritesPage() {
  return (
    <>
      <AccountPageTitle title={ACCOUNT_PAGE_TITLES.favorites} />
      <FavoritesView resolveFavorites={resolveFavoritesAction} />
    </>
  );
}
