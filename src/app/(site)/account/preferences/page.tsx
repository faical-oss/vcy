import type { Metadata } from "next";
import { AccountPageTitle } from "@/components/account/account-page-title";
import { PreferencesView } from "@/components/account/preferences-view";
import { ACCOUNT_PAGE_TITLES } from "@/constants/account";
import { savePreferencesAction } from "@/features/account/actions";
import { getAccountPreferences } from "@/features/account/queries";

export const metadata: Metadata = { title: ACCOUNT_PAGE_TITLES.preferences, description: "Tell us how you like to travel so we can personalize your recommendations." };

export default async function AccountPreferencesPage() {
  return (
    <>
      <AccountPageTitle title={ACCOUNT_PAGE_TITLES.preferences} />
      <PreferencesView initial={await getAccountPreferences()} onSave={savePreferencesAction} />
    </>
  );
}
