import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/helpers/cn";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children" | "className"> & {
  /** Visible label (required for accessibility). */
  label: string;
  description?: ReactNode;
  /** Right-aligned status text, e.g. "Subscribed". */
  status?: string;
  className?: string;
};

/** Checkbox card: a native input (keyboard, forms, screen readers) with a custom box. */
export function Checkbox({ label, description, status, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-input bg-surface p-4 text-left", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-primary bg-card text-primary-foreground peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="size-[13px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-primary">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-body">{description}</span> : null}
      </span>
      {status ? <span className="hidden shrink-0 text-xs font-semibold text-primary sm:block">{status}</span> : null}
    </label>
  );
}
