import type { Metadata } from "next";
import { AccountPageTitle } from "@/components/account/account-page-title";
import { TripsView } from "@/components/account/trips-view";
import { ACCOUNT_PAGE_TITLES } from "@/constants/account";
import { getAccountBookings } from "@/features/account/queries";

export const metadata: Metadata = { title: ACCOUNT_PAGE_TITLES.trips, description: "Your booking references, travel dates and confirmation details." };

export default async function AccountTripsPage() {
  return (
    <>
      <AccountPageTitle title={ACCOUNT_PAGE_TITLES.trips} />
      <TripsView bookings={await getAccountBookings()} />
    </>
  );
}
