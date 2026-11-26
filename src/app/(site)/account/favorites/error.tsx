"use client";

import { AccountError } from "@/components/account/account-error";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AccountError reset={reset} />;
}
