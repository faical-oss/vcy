import type { ComponentProps } from "react";
import { cn } from "@/helpers/cn";

type TextareaProps = ComponentProps<"textarea"> & {
  /** Visible label is required for accessibility; use `srOnlyLabel` to hide it visually. */
  label: string;
  srOnlyLabel?: boolean;
};

export function Textarea({ label, srOnlyLabel = false, id, className, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={textareaId}
        className={cn("text-xs font-semibold uppercase tracking-label text-primary", srOnlyLabel && "sr-only")}
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        className="min-h-36 w-full resize-y rounded-field border border-border bg-card px-3 py-2 text-sm text-primary placeholder:text-muted-blue focus:border-accent aria-invalid:border-error"
        {...props}
      />
    </div>
  );
}
