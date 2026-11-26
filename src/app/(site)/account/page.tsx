import type { Metadata } from "next";
import { AccountPageTitle } from "@/components/account/account-page-title";
import { OverviewView } from "@/components/account/overview-view";
import { ACCOUNT_PAGE_TITLES } from "@/constants/account";
import { SITE_NAME } from "@/constants/site";
import { getAccountBookings, getAccountFavorites, getAccountSummary } from "@/features/account/queries";

export const metadata: Metadata = {
  // `title.template` in the segment layout does not apply to the page beside it, so spell the full title out.
  title: { absolute: `${ACCOUNT_PAGE_TITLES.overview} | My Account | ${SITE_NAME}` },
  description: "Your trips, favorites and member status at a glance.",
};

export default async function AccountOverviewPage() {
  const [summary, bookings, favorites] = await Promise.all([getAccountSummary(), getAccountBookings(), getAccountFavorites()]);
  return (
    <>
      <AccountPageTitle title={ACCOUNT_PAGE_TITLES.overview} />
      <OverviewView summary={summary} bookings={bookings} favorites={favorites} />
    </>
  );
}
