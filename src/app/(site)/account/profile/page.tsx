import type { Metadata } from "next";
import { AccountPageTitle } from "@/components/account/account-page-title";
import { ProfileView } from "@/components/account/profile-view";
import { ACCOUNT_PAGE_TITLES } from "@/constants/account";
import { changePasswordAction, setConnectedAccountAction, setNewsletterAction } from "@/features/account/actions";
import { getAccountProfile } from "@/features/account/queries";

export const metadata: Metadata = { title: ACCOUNT_PAGE_TITLES.profile, description: "Manage your personal details, newsletter and sign-in options." };

export default async function AccountProfilePage() {
  return (
    <>
      <AccountPageTitle title={ACCOUNT_PAGE_TITLES.profile} />
      <ProfileView
        profile={await getAccountProfile()}
        onNewsletterChange={setNewsletterAction}
        onConnectedChange={setConnectedAccountAction}
        onChangePassword={changePasswordAction}
      />
    </>
  );
}
