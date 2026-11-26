import { Check, X } from "lucide-react";
import type { SearchOption } from "@/interfaces";
import { cn } from "@/helpers/cn";

interface Group {
  title?: string;
  options: SearchOption[];
}

interface SuggestionPanelProps {
  /** id of the listbox; the options are `<id>-option-<n>`, n counting in the order shown (column by column). */
  id: string;
  /** Caption ("EXPERIENCE TYPE"). */
  title: string;
  /** "pills": outlined chips in rows. "tiles": two columns of rectangles. "columns": groups in two columns. "list": one plain column, no group titles (search results). */
  layout: "pills" | "tiles" | "columns" | "list";
  /** One group, or for "columns" the groups in the order shown, with `column` on each. */
  groups: (Group & { column?: 1 | 2 })[];
  /** Index of the option the arrow keys are on (-1: none). */
  activeIndex: number;
  /** What was typed, for the "No results" line. */
  query: string;
  /** Slug of the option already picked: shown in the selected colour with a check. */
  selectedSlug?: string;
  /** Results are on their way: skeleton rows instead of the list. */
  loading?: boolean;
  onPick: (option: SearchOption) => void;
  /** Below lg the list has a Close button (it is as wide as the search row and may cover the page). */
  onClose?: () => void;
  /** Inside the sheet: in the page flow, no shadow, a shorter list that scrolls. */
  inline?: boolean;
}

const OPTION = "text-left transition-colors";
const PILL = "rounded-full border border-border bg-card px-3 py-1.5 text-xs text-primary";
const TILE = "border border-border bg-card px-3 py-2.5 text-xs text-primary";

/**
 * The dropdown of a combobox field: the suggestions as a listbox (`role="option"`, the keyboard's option is `aria-selected` and
 * named by the input's `aria-activedescendant`). Options take no focus: the mouse down is swallowed so the input keeps it.
 */
export function SuggestionPanel({ id, title, layout, groups, activeIndex, query, selectedSlug, loading, onPick, onClose, inline }: SuggestionPanelProps) {
  let counter = -1;
  const option = (item: SearchOption, className: string) => {
    const index = ++counter;
    const picked = item.slug === selectedSlug;
    return (
      <button
        key={item.slug}
        id={`${id}-option-${index}`}
        type="button"
        role="option"
        tabIndex={-1}
        aria-selected={index === activeIndex}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onPick(item)}
        className={cn(OPTION, className, picked ? "border-primary bg-primary font-medium text-white hover:text-white" : index === activeIndex ? "border-primary bg-surface-blue" : "hover:border-primary")}
      >
        {item.label}
        {picked ? <Check className="ml-1.5 inline size-3.5 align-text-bottom" aria-hidden /> : null}
      </button>
    );
  };
  const empty = groups.every((group) => group.options.length === 0);

  return (
    <div className={cn("z-40 overscroll-contain rounded-card border border-border bg-card p-4", inline ? "max-h-[40dvh] overflow-y-auto" : "max-h-[min(60dvh,32rem)] overflow-y-auto shadow-xl lg:max-h-none lg:overflow-visible")}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-micro uppercase tracking-widest text-muted-blue">{title}</p>
        {onClose ? (
          // For touch and mouse (a keyboard has Escape, and Tab must leave the field): not a tab stop; the mouse down is swallowed so the input keeps the focus, as with the options.
          <button type="button" tabIndex={-1} aria-label={`Close ${title.toLowerCase()} list`} onMouseDown={(event) => event.preventDefault()} onClick={onClose} className="-my-2 -mr-2 flex size-11 items-center justify-center rounded-full text-body hover:bg-surface lg:hidden">
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>
      {loading ? (
        <div role="status" aria-label="Searching" className="space-y-3 py-1">
          {[72, 56, 64, 48, 60].map((width) => (
            <div key={width} className="h-4 animate-pulse rounded bg-border" style={{ width: `${width}%` }} />
          ))}
        </div>
      ) : empty ? (
        <p className="text-sm text-body">No results for “{query.trim()}”</p>
      ) : (
        <div id={id} role="listbox" aria-label={title}>
          {layout === "pills" ? <div className="flex flex-wrap gap-2">{groups[0].options.map((item) => option(item, PILL))}</div> : null}
          {layout === "tiles" ? <div className="grid grid-cols-2 gap-2">{groups[0].options.map((item) => option(item, TILE))}</div> : null}
          {layout === "list" ? <div className="flex flex-col">{groups.flatMap((group) => group.options).map((item) => option(item, "min-h-9 rounded px-2 py-1.5 text-sm text-primary hover:text-accent"))}</div> : null}
          {layout === "columns" ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {([1, 2] as const).map((column) => (
                <div key={column} className="space-y-4">
                  {groups
                    .filter((group) => group.column === column && group.options.length > 0)
                    .map((group) => (
                      <div key={group.title}>
                        <p className="mb-1.5 text-micro uppercase tracking-widest text-muted-blue">{group.title}</p>
                        <div className="flex flex-col">{group.options.map((item) => option(item, "min-h-9 rounded px-2 py-1.5 text-sm text-primary hover:text-accent"))}</div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
