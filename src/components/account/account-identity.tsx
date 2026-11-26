import { ShieldCheck } from "lucide-react";
import { cn } from "@/helpers/cn";
import { initialsOf } from "@/helpers/tier";

interface AccountIdentityProps {
  firstName: string;
  email: string;
  tierLevel: number;
}

/** Contents of the welcome band: initials avatar, title, email and the member pill. */
export function AccountIdentity({ firstName, email, tierLevel }: AccountIdentityProps) {
  return (
    <>
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full border border-white/80 bg-card text-base font-bold tracking-wider text-primary shadow-sm sm:size-16 sm:text-lg"
      >
        {initialsOf(firstName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-eyebrow-lg text-body">My account</p>
        <p className="mt-1 font-display text-title-md font-medium leading-none text-primary sm:text-account-title">Welcome back, {firstName}</p>
        <p className="mt-2 truncate text-sm text-body">{email}</p>
      </div>
      <div className="w-full sm:ml-auto sm:w-auto">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm">
          <ShieldCheck aria-hidden className="size-4 text-accent" />
          <span>Vacayou member</span>
          <span aria-hidden className="h-4 w-px bg-border-soft" />
          <span className="text-body">Wellness level {tierLevel}</span>
        </p>
      </div>
    </>
  );
}

const BLOCK = "animate-pulse rounded-card bg-border motion-reduce:animate-none";

/** Same footprint as the real band so nothing shifts when the name arrives. */
export function AccountIdentitySkeleton() {
  return (
    <>
      <span aria-hidden className={cn(BLOCK, "size-12 rounded-full sm:size-16")} />
      {/* Line for line the height of the real text: 16 + 4 + 36 (42 from sm) + 8 + 20. */}
      <div className="min-w-0 flex-1">
        <span aria-hidden className={cn(BLOCK, "block h-4 w-20")} />
        <span aria-hidden className={cn(BLOCK, "mt-1 block h-9 w-64 max-w-full sm:h-[42px]")} />
        <span aria-hidden className={cn(BLOCK, "mt-2 block h-5 w-40")} />
      </div>
      <div className="w-full sm:ml-auto sm:w-auto">
        <span aria-hidden className={cn(BLOCK, "block h-9 w-64 max-w-full rounded-full")} />
      </div>
    </>
  );
}
