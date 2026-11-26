import { Apple } from "lucide-react";
import type { AuthProvider } from "@/interfaces";

/** Brand marks for the social providers: Google "G", the Apple glyph, Facebook "f". Decorative (the label is next to it). */
export function ProviderIcon({ provider }: { provider: AuthProvider }) {
  if (provider === "google") return <span aria-hidden className="font-bold text-brand-google">G</span>;
  if (provider === "apple") return <Apple aria-hidden className="size-4" />;
  return (
    <span aria-hidden className="flex size-4 items-center justify-center rounded-full bg-brand-facebook text-xs font-bold lowercase leading-none text-white">
      f
    </span>
  );
}
