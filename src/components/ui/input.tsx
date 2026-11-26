import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/helpers/cn";

type InputProps = ComponentProps<"input"> & {
  /** Visible label is required for accessibility; use `srOnlyLabel` to hide it visually. */
  label: string;
  srOnlyLabel?: boolean;
  /** Optional leading icon (decorative). */
  icon?: ReactNode;
};

export function Input({ label, srOnlyLabel = true, icon, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className={cn("text-eyebrow font-semibold text-primary", srOnlyLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-body">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            "h-[46px] w-full rounded-input border border-border bg-card px-4 text-base text-primary sm:text-sm placeholder:text-body focus:border-accent aria-invalid:border-error",
            icon && "pl-[38px]",
          )}
          {...props}
        />
      </div>
    </div>
  );
}
