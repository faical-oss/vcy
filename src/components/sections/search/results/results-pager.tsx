import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/helpers/cn";
import { pageWindow } from "@/helpers/search-results";

const BOX = "flex size-9 items-center justify-center border text-sm";

/** "Showing 1–12 of 18 results" and the page numbers (only when there is more than one page). */
export function ResultsPager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-5 sm:flex-row">
      <p className="text-sm text-body">
        Showing {from}–{to} of {total} {total === 1 ? "result" : "results"}
      </p>
      {pages > 1 ? (
        <nav aria-label="Pagination">
          <ul className="flex items-center gap-1.5">
            <li>
              <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className={cn(BOX, "border-border text-primary hover:border-primary disabled:pointer-events-none disabled:opacity-40")}>
                <ChevronLeft className="size-4" aria-hidden />
              </button>
            </li>
            {pageWindow(page, pages).map((entry, index) => (
              <li key={`${entry}-${index}`}>
                {entry === "gap" ? (
                  <span aria-hidden className="px-1 text-body">…</span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Page ${entry}`}
                    aria-current={entry === page ? "page" : undefined}
                    onClick={() => onPage(entry)}
                    className={cn(BOX, "rounded-full", entry === page ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary hover:border-primary")}
                  >
                    {entry}
                  </button>
                )}
              </li>
            ))}
            <li>
              <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className={cn(BOX, "border-border text-primary hover:border-primary disabled:pointer-events-none disabled:opacity-40")}>
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
