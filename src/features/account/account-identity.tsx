import { AccountIdentity } from "@/components/account/account-identity";
import { getAccountProfile, getAccountSummary } from "./queries";

/** Reads the member (request-time), so render it inside <Suspense> with AccountIdentitySkeleton as the fallback. */
export async function AccountIdentityLoader() {
  const [profile, summary] = await Promise.all([getAccountProfile(), getAccountSummary()]);
  return <AccountIdentity firstName={profile.account.firstName} email={profile.account.email} tierLevel={summary.tier.level} />;
}
