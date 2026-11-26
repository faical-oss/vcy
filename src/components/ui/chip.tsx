import { Check } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

type ChipProps = Omit<ComponentProps<"button">, "aria-pressed" | "onChange"> & {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
};

/** Toggle chip: a real button with aria-pressed and a check icon when selected. Matches the prototype's 40px chips. */
export function Chip({ selected, onSelectedChange, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelectedChange(!selected)}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 whitespace-normal rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors motion-reduce:transition-none",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary hover:border-muted-blue hover:bg-surface",
        className,
      )}
      {...props}
    >
      {selected ? <Check aria-hidden className="size-4 shrink-0" /> : null}
      {children}
    </button>
  );
}
