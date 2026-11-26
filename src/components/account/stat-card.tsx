import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Compact overview card: tiny label top-left, gold icon top-right, content below. */
export function StatCard({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-card bg-card p-3 shadow-sm sm:p-5">
      <div className="flex items-start justify-between">
        <p className="pr-1 text-nano font-semibold uppercase leading-tight tracking-micro text-muted-blue sm:text-xs sm:tracking-widest">{label}</p>
        <Icon aria-hidden className="size-4 shrink-0 text-accent sm:size-4.5" />
      </div>
      {children}
    </div>
  );
}
