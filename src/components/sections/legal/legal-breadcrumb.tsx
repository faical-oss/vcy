"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Sticky "‹ Back / Page title" bar shown above legal documents. Back goes to the previous page, or Home if there is none. */
export function LegalBreadcrumb({ label }: { label: string }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(ROUTES.home);
  }

  return (
    <div className="sticky top-header z-30 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-14 max-w-[860px] items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-primary"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          Back
        </button>
        <span aria-hidden className="hidden text-border sm:inline">
          /
        </span>
        <span className="hidden text-sm font-medium text-primary sm:inline">{label}</span>
      </div>
    </div>
  );
}
